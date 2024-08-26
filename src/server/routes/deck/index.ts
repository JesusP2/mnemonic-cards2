import { parseWithZod } from '@conform-to/zod';
import { and, count, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { z } from 'zod';
import {
  createDeckSchema,
  updateCardSchema,
  updateDeckSchema,
} from '../../../lib/schemas';
import type { Result } from '../../../lib/types';
import { db } from '../../db/pool';
import { cardTable, deckTable } from '../../db/schema';
import { createCardSchema } from '../../db/types';
import {
  createPresignedUrl,
  uploadFile as uploadFileToR2,
} from '../../utils/r2';

export const deckRoute = new Hono();

async function uploadFile(file: File, key: string) {
  return uploadFileToR2(Buffer.from(await file.arrayBuffer()), key);
}

async function idk(
  formData: FormData,
  deckId: string,
): Promise<Result<z.infer<typeof createCardSchema>, Error>> {
  const newCard = {} as Record<string, unknown>;
  const entries = [...formData.entries()];
  for (const [k, v] of entries) {
    if (typeof v !== 'string') {
      continue;
    }
    if (v === 'undefined') {
      newCard[k] = undefined;
    } else {
      newCard[k] = JSON.parse(v);
    }
  }
  async function uploadFiles(metadata: string[], files: File[]) {
    if (metadata.length !== files.length) {
      throw new Error('arrays must be of the same length');
    }
    const promises = [];
    for (let i = 0; i < metadata.length; i++) {
      promises.push(uploadFile(files[i] as File, metadata[i] as string));
    }
    return Promise.allSettled(promises);
  }
  await uploadFiles(
    [
      ...(newCard.frontFilesMetadata as string[]),
      ...(newCard.backFilesMetadata as string[]),
    ],
    [
      ...(formData.getAll('frontFiles') as File[]),
      ...(formData.getAll('backFiles') as File[]),
    ],
  );

  const newCardResult = createCardSchema.safeParse({
    ...newCard,
    deckId: deckId,
    frontFiles: JSON.stringify(newCard.frontFilesMetadata),
    backFiles: JSON.stringify(newCard.backFilesMetadata),
    last_review: newCard.last_review ? newCard.last_review : null,
  });
  return newCardResult;
}

deckRoute.post('/:deckId/card', async (c) => {
  // TODO: check user has access to deck
  const newCardResult = await idk(
    await c.req.formData(),
    c.req.param('deckId'),
  );
  if (!newCardResult.success) {
    return c.json({
      message: 'Invalid data',
    });
  }
  await db.insert(cardTable).values(newCardResult.data);
  return c.json({ message: 'completed' });
});

deckRoute.delete('/:deckId/card/:cardId', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json({ message: 'Unauthorized' }, 403);
  }

  const deckId = c.req.param('deckId');
  const cardId = c.req.param('cardId');

  // TODO: we probably need a join with deckTable
  await db
    .delete(cardTable)
    .where(
      and(
        eq(cardTable.id, cardId),
        eq(cardTable.deckId, deckId),
        eq(deckTable.userId, loggedInUser.id),
      ),
    );

  return c.json({ message: 'Card deleted successfully' });
});

// Update card
deckRoute.put('/:deckId/card/:cardId', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json({ message: 'Unauthorized' }, 403);
  }

  const newFieldsResult = updateCardSchema.safeParse(await c.req.json());
  if (!newFieldsResult.success) {
    return c.json({ message: 'Unauthorized' }, 400);
  }
  const deckId = c.req.param('deckId');
  const cardId = c.req.param('cardId');
  const [total] = await db
    .select({ count: count() })
    .from(deckTable)
    .where(
      and(eq(deckTable.id, deckId), eq(deckTable.userId, loggedInUser.id)),
    );
  if (!total?.count) {
    return c.json({ message: 'Unauthorized' }, 400);
  }

  await db
    .update(cardTable)
    .set(newFieldsResult.data)
    .where(eq(cardTable.id, cardId));

  return c.json({ message: 'Card updated successfully' });
});

deckRoute.get('/:deckId/review', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json(null, 403);
  }

  const cards = await db
    .select({
      id: cardTable.id,
      deckId: cardTable.deckId,
      frontMarkdown: cardTable.frontMarkdown,
      backMarkdown: cardTable.backMarkdown,
      frontFilesMetadata: cardTable.frontFiles,
      backFilesMetadata: cardTable.backFiles,
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
        eq(deckTable.userId, loggedInUser.id),
        eq(deckTable.id, c.req.param('deckId')),
      ),
    );

  const promises = cards.map(async (card) => {
    const frontFilesMetadata = JSON.parse(card.frontFilesMetadata);
    const frontFilesUrlPromises = frontFilesMetadata.map((file: string) =>
      createPresignedUrl(file),
    ) as Promise<string>[];
    const backFilesMetadata = JSON.parse(card.backFilesMetadata);
    const backFilesUrlsPromises = backFilesMetadata.map((file: string) =>
      createPresignedUrl(file),
    ) as Promise<string>[];
    const links = await Promise.all([
      ...frontFilesUrlPromises,
      ...backFilesUrlsPromises,
    ]);
    const frontLinks = links.slice(0, frontFilesMetadata.length);
    const backLinks = links.slice(backFilesMetadata.length);
    for (let i = 0; i < frontFilesMetadata.length; i++) {
      card.frontMarkdown = card.frontMarkdown.replaceAll(
        frontFilesMetadata[i],
        frontLinks[i] as string,
      );
    }
    for (let i = 0; i < backFilesMetadata.length; i++) {
      card.backMarkdown = card.backMarkdown.replaceAll(
        backFilesMetadata[i],
        backLinks[i] as string,
      );
    }
    return card;
  });
  const updatedCards = await Promise.allSettled(promises);
  for (const updatedCard of updatedCards) {
    if (updatedCard.status === 'rejected') {
      return c.json(
        {
          message: 'Could not process card',
        },
        400,
      );
    }
  }

  return c.json(
    cards.map((card) => ({
      ...card,
      frontFilesMetadata: JSON.parse(card.frontFilesMetadata),
      backFilesMetadata: JSON.parse(card.backFilesMetadata),
    })),
  );
});

// Update deck info
deckRoute.put('/:deckId', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json({ message: 'Unauthorized' }, 403);
  }

  const deckId = c.req.param('deckId');
  const submission = parseWithZod(await c.req.json(), {
    schema: updateDeckSchema,
  });

  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }

  await db
    .update(deckTable)
    .set(submission.value)
    .where(
      and(eq(deckTable.id, deckId), eq(deckTable.userId, loggedInUser.id)),
    );

  return c.json({ message: 'Deck updated successfully' });
});

deckRoute.get('/', async (c) => {
  const loggedInUser = c.get('user');
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

deckRoute.post('/', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: createDeckSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    await db.insert(deckTable).values({
      id: submission.value.id,
      userId: loggedInUser.id,
      private: 0,
      name: submission.value.name,
      description: submission.value.description,
    });
    return c.json({
      id: submission.value.id,
      name: submission.value.name,
    });
  } catch (err) {
    return c.json(
      {
        message: 'Something went wrong, please try again.',
      },
      400,
    );
  }
});
deckRoute.delete('/:deckId', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json(null, 403);
  }
  try {
    await db
      .delete(deckTable)
      .where(
        and(
          eq(deckTable.id, c.req.param('deckId')),
          eq(deckTable.userId, loggedInUser.id),
        ),
      );
    return c.json({
      message: 'completed',
    });
  } catch (err) {
    console.error(err);
    return c.json(
      {
        message: 'completed',
      },
      400,
    );
  }
});
