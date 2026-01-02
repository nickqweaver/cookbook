import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const recipe = sqliteTable('recipe', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text('title').notNull().unique(),
  description: text('description'),
  servings: integer('servings', { mode: 'number' }).notNull().default(1),
  preptime: integer('preptime', { mode: 'number' }).notNull(), // Minutes
  cooktime: integer('cooktime', { mode: 'number' }).notNull(), // Minutes
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})

export const ingredient = sqliteTable('ingredient', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  unit: text('unit').notNull(),
  recipe: integer('recipe')
    .references(() => recipe.id, { onDelete: 'cascade' })
    .notNull(),
})

export const instruction = sqliteTable(
  'instruction',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    order: integer('order').notNull(),
    recipe: integer('recipe')
      .references(() => recipe.id, { onDelete: 'cascade' })
      .notNull(),
    content: text('content').notNull(),
  },
  (t) => [unique().on(t.order, t.recipe)],
)

export const cook = sqliteTable('cook', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['in_progress', 'completed', 'cancelled'] })
    .default('in_progress')
    .notNull(),
  currentStep: integer('current_step', { mode: 'number' }).default(1).notNull(),
  createdBy: text('created_by'),
  recipe: integer('recipe')
    .references(() => recipe.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  notes: text('notes'),
})

export const cookInstruction = sqliteTable(
  'cook_instruction',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    cook: integer('cook')
      .references(() => cook.id, { onDelete: 'cascade' })
      .notNull(),
    instruction: integer('instruction')
      .references(() => instruction.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    checked: integer('checked', { mode: 'boolean' }).default(false).notNull(),
  },
  (t) => [unique().on(t.cook, t.instruction)],
)

export const cookIngredient = sqliteTable(
  'cook_ingredient',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    cook: integer('cook')
      .references(() => cook.id, { onDelete: 'cascade' })
      .notNull(),
    ingredient: integer('ingredient')
      .references(() => ingredient.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    checked: integer('checked', { mode: 'boolean' }).default(false).notNull(),
  },
  (t) => [unique().on(t.cook, t.ingredient)],
)

// Junction table for instruction-to-ingredient mapping
export const instructionIngredient = sqliteTable(
  'instruction_ingredient',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    instruction: integer('instruction')
      .references(() => instruction.id, { onDelete: 'cascade' })
      .notNull(),
    ingredient: integer('ingredient')
      .references(() => ingredient.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [unique().on(t.instruction, t.ingredient)],
)

export type RecipeInput = typeof recipe.$inferInsert
export type Recipe = typeof recipe.$inferSelect
export type IngredientInput = typeof ingredient.$inferInsert
export type Ingredient = typeof ingredient.$inferSelect
export type InstructionInput = typeof instruction.$inferInsert
export type Instruction = typeof instruction.$inferSelect
export type CookInput = typeof cook.$inferInsert
export type Cook = typeof cook.$inferSelect
export type CookIngredientInput = typeof cookIngredient.$inferInsert
export type CookIngredient = typeof cookIngredient.$inferSelect
export type CookInstructionInput = typeof cookInstruction.$inferInsert
export type CookInstruction = typeof cookInstruction.$inferSelect
export type InstructionIngredientInput =
  typeof instructionIngredient.$inferInsert
export type InstructionIngredient = typeof instructionIngredient.$inferSelect
