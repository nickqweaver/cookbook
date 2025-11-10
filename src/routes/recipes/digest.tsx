import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type {
  IngredientInput,
  InstructionInput,
  RecipeInput,
} from '@/db/schema'
import { ingredient, instruction, recipe } from '@/db/schema'
import { db } from '@/db'

export const Route = createFileRoute('/recipes/digest')({
  component: RouteComponent,
})

export type Payload = RecipeInput & {
  instructions: Array<InstructionInput>
  ingredients: Array<IngredientInput>
}

const digestRecipe = createServerFn({ method: 'POST' })
  .inputValidator((data: Payload) => {
    if (
      typeof data.preptime !== 'number' ||
      typeof data.cooktime !== 'number' ||
      typeof data.servings !== 'number' ||
      typeof data.title !== 'string' ||
      typeof data.instructions !== 'object' ||
      typeof data.ingredients !== 'object'
    ) {
      throw new Error('Missing required fields')
    }

    return data
  })
  .handler(async ({ data }) => {
    try {
      const transaction = await db.transaction(async (tx) => {
        try {
          const { ingredients: ing, instructions: ins, ...rest } = data
          const [r] = await tx.insert(recipe).values(rest).returning()

          const ig = ing.map((i) => ({ ...i, recipe: r.id }))
          const inst = ins.map((i) => ({ ...i, recipe: r.id }))
          await Promise.all([
            tx.insert(ingredient).values(ig),
            tx.insert(instruction).values(inst),
          ])

          return r
        } catch (err) {
          console.error('Transaction failed, rolling back')
          throw new Error(
            err instanceof Error ? err.message : 'Failed to Digest Recipe!',
          )
        }
      })

      return {
        success: true,
        data: transaction,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to create recipe',
      }
    }
  })

function RouteComponent() {
  return <div>Hello "/recipes/digest"!</div>
}
