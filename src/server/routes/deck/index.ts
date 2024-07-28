import { parseWithZod } from "@conform-to/zod";
import DOMPurify from "dompurify";
import { Hono } from "hono";
import { JSDOM } from "jsdom";
import { createEmptyCard, Rating } from "ts-fsrs";
import { createDeckSchema } from "../../../lib/schemas";
import type { Result } from "../../../lib/types";
import { db } from "../../db/pool";
import { cardTable, deckTable } from "../../db/schema";
import { createUlid } from "../../lucia";
import { uploadFile as uploadFileToR2 } from "../../utils/r2";
import { sql } from "drizzle-orm";

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
  const frontViewResult = processView(
    formData.get("front_view_markdown") as string,
    formData.get("front_view_files") as unknown as File[],
    formData.get("front_view_files_metadata") as string,
  );
  const backViewResult = processView(
    formData.get("back_view_markdown") as string,
    formData.get("back_view_files") as unknown as File[],
    formData.get("back_view_files_metadata") as string,
  );
  if (!frontViewResult.success || !backViewResult.success) {
    return c.json({ message: "invalid data" });
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
    .slice(backViewResult.data.files.length)
    .filter((key) => key.status === "fulfilled")
    .map((key) => key.value);
  const emptyCard = createEmptyCard();
  emptyCard.difficulty = Rating.Again;
  await db.insert(cardTable).values({
    id: createUlid(),
    deckId: c.req.param("deckId"),
    frontMarkdown: frontViewResult.data.markdown,
    backMarkdown: backViewResult.data.markdown,
    frontFiles: JSON.stringify(frontKeys),
    backFiles: JSON.stringify(backKeys),
    ...emptyCard,
    due: emptyCard.due.toISOString(),
    last_review: emptyCard.due.toISOString(),
  });
  return c.json({ message: "completed" });
});

deckRoute.get("/", async (c) => {
  const loggedInUser = c.get("user");
  if (!loggedInUser) {
    return c.json(null, 403);
  }
  const statement = sql`SELECT ${deckTable.name} AS name, ${deckTable.id} AS id,
  SUM(CASE WHEN ${cardTable.difficulty} = 4 THEN 1 ELSE 0 END) AS easy,
  SUM(CASE WHEN ${cardTable.difficulty} = 3 THEN 1 ELSE 0 END) AS good,
  SUM(CASE WHEN ${cardTable.difficulty} = 2 THEN 1 ELSE 0 END) AS hard,
  SUM(CASE WHEN ${cardTable.difficulty} = 1 THEN 1 ELSE 0 END) AS again
  FROM ${deckTable} LEFT JOIN ${cardTable} ON ${deckTable.id} = ${cardTable.deckId}
  WHERE ${deckTable.userId} = ${loggedInUser.id}
  GROUP BY ${deckTable.id}`;
  const res = await db.run(statement)
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
