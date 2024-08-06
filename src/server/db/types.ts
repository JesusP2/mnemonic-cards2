import { createSelectSchema } from 'drizzle-zod'
import { cardTable } from './schema'
import type { z } from 'zod'

const selectCardSchema = createSelectSchema(cardTable)
export type SelectCard = z.infer<typeof selectCardSchema>
