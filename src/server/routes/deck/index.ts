import { parseWithZod } from "@conform-to/zod";
import DOMPurify from "dompurify";
import { Hono } from "hono";
import { JSDOM } from "jsdom";
import { createEmptyCard, Rating } from "ts-fsrs";
import { createDeckSchema } from "../../../lib/schemas";
import type { Result } from "../../../lib/types";
import { db } from "../../db/pool";
import { cardTable, deckTable } from "../../db/schema";
import { createUlid } from "../../utils/ulid";
import {
  createPresignedUrl,
  uploadFile as uploadFileToR2,
} from "../../utils/r2";
import { and, eq, lt, sql } from "drizzle-orm";
import type { SelectCard } from "../../db/types";

const { window } = new JSDOM("<!DOCTYPE html>");
const domPurify = DOMPurify(window);

export const deckRoute = new Hono();

async function uploadFile(file: File, key: string) {
  return uploadFileToR2(Buffer.from(await file.arrayBuffer()), key);
}

function processView(
  _markdown: string,
  files: File[],
  _filesMetadata: string,
): Result<{ markdown: string; files: Promise<string>[] }, Error> {
  let markdown = domPurify.sanitize(_markdown, {
    ALLOW_UNKNOWN_PROTOCOLS: true,
  });
  const filesMetadata = JSON.parse(_filesMetadata) as { url: string }[];
  const filteredFiles: Promise<string>[] = [];
  // NOTE: code should work  for  front and back markdown,  save keys as  string.
  // NOTE: Check size of files do not exceed limit.
  for (let i = 0; i < filesMetadata.length; i++) {
    const fileMetadata = filesMetadata[i];
    const file = files[i];
    if (!fileMetadata || !file) {
      return {
        success: false,
        error: new Error("file or fileMetada not found"),
      };
    }
    if (markdown.indexOf(fileMetadata.url) !== -1) {
      const extension = file.type.split("/")[1];
      const key = `${createUlid()}.${extension}`;
      filteredFiles.push(uploadFile(file, key));
      markdown = markdown.replaceAll(fileMetadata.url, key);
    }
  }
  return {
    success: true,
    data: {
      markdown,
      files: filteredFiles,
    },
  };
}

deckRoute.post("/:deckId/card", async (c) => {
  // TODO: check user has access to deck
  const formData = await c.req.formData();
  const newCard = {} as Record<string, unknown>;
  const entries = [...formData.entries()];
  for (const [k, v] of entries) {
    if (typeof v !== "string") {
      return;
    }
    if (v === "undefined") {
      newCard[k] = undefined;
    } else {
      newCard[k] = JSON.parse(v);
    }
  }

  const frontViewResult = processView(
    formData.get("frontViewMarkdown") as string,
    formData.getAll("frontViewFiles") as unknown as File[],
    formData.get("frontFiles") as string,
  );
  const backViewResult = processView(
    formData.get("backViewMarkdown") as string,
    formData.getAll("backViewFiles") as unknown as File[],
    formData.get("backFiles") as string,
  );
  if (!frontViewResult.success || !backViewResult.success) {
    return c.json({ message: "invalid data" }, 400);
  }
  const keysResult = await Promise.allSettled([
    ...frontViewResult.data.files,
    ...backViewResult.data.files,
  ]);
  const frontKeys = keysResult
    .slice(0, frontViewResult.data.files.length)
    .filter((key) => key.status === "fulfilled")
    .map((key) => key.value);
  const backKeys = keysResult
    .slice(frontViewResult.data.files.length)
    .filter((key) => key.status === "fulfilled")
    .map((key) => key.value);
  await db.insert(cardTable).values({
    ...newCard,
    frontFiles: JSON.stringify(frontKeys),
    backFiles: JSON.stringify(backKeys),
    deckId: c.req.param("deckId"),
    frontMarkdown: frontViewResult.data.markdown,
    backMarkdown: backViewResult.data.markdown,
    last_review: newCard.last_review ? newCard.last_review : null,
  } as SelectCard);
  return c.json({ message: "completed" });
});

deckRoute.get("/:deckId/review", async (c) => {
  const loggedInUser = c.get("user");
  if (!loggedInUser) {
    return c.json(null, 403);
  }

  const cards = await db
    .select({
      id: cardTable.id,
      deckId: cardTable.deckId,
      frontMarkdown: cardTable.frontMarkdown,
      backMarkdown: cardTable.backMarkdown,
      frontFiles: cardTable.frontFiles,
      backFiles: cardTable.backFiles,
      due: cardTable.due,
      stability: cardTable.stability,
      difficulty: cardTable.difficulty,
      rating: cardTable.rating,
      elapsed_days: cardTable.elapsed_days,
      scheduled_days: cardTable.scheduled_days,
      reps: cardTable.reps,
      lapses: cardTable.lapses,
      state: cardTable.state,
      last_review: cardTable.last_review,
      createdAt: cardTable.createdAt,
      updatedAt: cardTable.updatedAt,
    })
    .from(cardTable)
    .innerJoin(deckTable, eq(cardTable.deckId, deckTable.id))
    .where(
      and(
        // lt(cardTable.due, Date.now()),
        eq(deckTable.userId, loggedInUser.id),
        eq(deckTable.id, c.req.param("deckId")),
      ),
    );
  // .limit(2);
  const promises = cards.map(async (card) => {
    const frontFiles = JSON.parse(card.frontFiles);
    const frontUrlsPromises = frontFiles.map((file: string) =>
      createPresignedUrl(file),
    ) as Promise<string>[];
    const backFiles = JSON.parse(card.backFiles);
    const backUrlsPromises = backFiles.map((file: string) =>
      createPresignedUrl(file),
    ) as Promise<string>[];
    const links = await Promise.all([
      ...frontUrlsPromises,
      ...backUrlsPromises,
    ]);
    const frontLinks = links.slice(0, frontFiles.length);
    const backLinks = links.slice(backFiles.length);
    for (let i = 0; i < frontFiles.length; i++) {
      card.frontMarkdown = card.frontMarkdown.replaceAll(
        frontFiles[i],
        frontLinks[i] as string,
      );
    }
    for (let i = 0; i < backFiles.length; i++) {
      card.backMarkdown = card.backMarkdown.replaceAll(
        backFiles[i],
        backLinks[i] as string,
      );
    }
    return card;
  });
  const updatedCards = await Promise.allSettled(promises);
  for (const updatedCard of updatedCards) {
    if (updatedCard.status === "rejected") {
      console.error(updatedCard.reason)
      return c.json(
        {
          message: "Could not process card",
        },
        400,
      );
    }
  }
  return c.json(cards);
});

// deckRoute.put("/:deckId/card/:cardId", async (c) => {
//
// });

deckRoute.get("/", async (c) => {
  const loggedInUser = c.get("user");
  if (!loggedInUser) {
    return c.json(null, 403);
  }
  const statement = sql`SELECT ${deckTable.name} AS name, ${deckTable.id} AS id,
  SUM(CASE WHEN ${cardTable.rating} = 4 THEN 1 ELSE 0 END) AS easy,
  SUM(CASE WHEN ${cardTable.rating} = 3 THEN 1 ELSE 0 END) AS good,
  SUM(CASE WHEN ${cardTable.rating} = 2 THEN 1 ELSE 0 END) AS hard,
  SUM(CASE WHEN ${cardTable.rating} = 1 THEN 1 ELSE 0 END) AS again
  FROM ${deckTable} LEFT JOIN ${cardTable} ON ${deckTable.id} = ${cardTable.deckId}
  WHERE ${deckTable.userId} = ${loggedInUser.id}
  GROUP BY ${deckTable.id}`;
  const res = await db.run(statement);

  return c.json(res.rows);
});

deckRoute.post("/", async (c) => {
  const loggedInUser = c.get("user");
  if (!loggedInUser) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: createDeckSchema,
  });
  if (submission.status !== "success") {
    return c.json(submission.reply(), 400);
  }
  try {
    const deckId = createUlid();
    await db.insert(deckTable).values({
      id: deckId,
      userId: loggedInUser.id,
      private: 0,
      name: submission.value.name,
      description: submission.value.description,
    });
    return c.json({
      deckId,
      name: submission.value.name,
    });
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong, please try again.",
      },
      400,
    );
  }
});
