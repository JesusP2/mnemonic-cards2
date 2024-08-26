import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { cardTable } from './schema';

const selectCardSchema = createSelectSchema(cardTable);
export type SelectCard = z.infer<typeof selectCardSchema>;
export type ClientSideCard = Omit<SelectCard, 'frontFiles' | 'backFiles'> & {
  frontFilesMetadata: string[];
  backFilesMetadata: string[];
};

export const createCardSchema = createInsertSchema(cardTable);
