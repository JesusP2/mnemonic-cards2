import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { cardTable } from "./schema";
import type { z } from "zod";

const selectCardSchema = createSelectSchema(cardTable);
export type SelectCard = z.infer<typeof selectCardSchema>;
export type ClientSideCard = Omit<SelectCard, "frontFiles" | "backFiles"> & {
  frontFilesMetadata: string[];
  backFilesMetadata: string[];
};

export const createCardSchema = createInsertSchema(cardTable);
