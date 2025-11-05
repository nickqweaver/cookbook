import { useForm } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import type {
  Ingredient,
  IngredientInput,
  Instruction,
  Recipe,
} from '@/db/schema'
import { db } from '@/db'
import { ingredient, instruction, recipe } from '@/db/schema'

const getRecipe = createServerFn({ method: 'GET' })
  .inputValidator((data: string) => {
    const safeInt = parseInt(data)

    if (isNaN(safeInt)) {
      throw new Error('Invalid recipe ID provided')
    }
    return safeInt
  })
  .handler(async ({ data }) => {
    try {
      const rows = await db
        .select()
        .from(recipe)
        .leftJoin(ingredient, eq(ingredient.recipe, recipe.id))
        .leftJoin(instruction, eq(instruction.recipe, recipe.id))
        .where(eq(recipe.id, data))

      if (rows.length === 0) {
        throw new Error('No recipe with that ID found')
      }

      type GroupedRecipe = {
        recipe: Recipe
        ingredients: Array<Ingredient>
        instructions: Array<Instruction>
      }

      const initialGrouped: GroupedRecipe = {
        recipe: {
          id: -1,
        } as Recipe,
        instructions: [],
        ingredients: [],
      }

      const grouped = rows.reduce<GroupedRecipe>((acc, curr) => {
        if (acc.recipe.id === -1) {
          return {
            recipe: curr.recipe,
            ingredients: curr.ingredient ? [curr.ingredient] : [],
            instructions: curr.instruction ? [curr.instruction] : [],
          }
        }

        return {
          recipe: acc.recipe,
          ingredients: curr.ingredient
            ? [...acc.ingredients, curr.ingredient]
            : acc.ingredients,
          instructions: curr.instruction
            ? [...acc.instructions, curr.instruction]
            : acc.instructions,
        }
      }, initialGrouped)

      return {
        success: true,
        data: grouped,
      }
    } catch (err) {
      console.error(err)
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to retrieve recipe',
      }
    }
  })

const addIngredient = createServerFn({ method: 'POST' })
  .inputValidator((data: IngredientInput) => data)
  .handler(async ({ data }) => {
    try {
      const [insert] = await db.insert(ingredient).values(data).returning()

      return {
        success: true,
        data: insert,
      }
    } catch (err) {
      console.error(err)
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to retrieve recipe',
      }
    }
  })

export const Route = createFileRoute('/recipes/$id')({
  component: RouteComponent,
  loader: async (args) => await getRecipe({ data: args.params.id }),
})

function RouteComponent() {
  const data = Route.useLoaderData()

  if (!data.success) {
    return <div>{data.message}</div>
  }

  const defaultIngrediennt: Omit<IngredientInput, 'recipe'> = {
    name: '',
    amount: 0,
    unit: '',
  }

  const { recipe: r, ingredients, instructions } = data.data

  const form = useForm({
    defaultValues: defaultIngrediennt,
    onSubmit: async ({ value }) => {
      const result = await addIngredient({ data: { ...value, recipe: r.id } })

      // Invalidate cache here
      console.log(result)
    },
  })

  return (
    <main>
      <section>
        <div>{r.title}</div>
        <div>{r.description}</div>
        <div>{r.cooktime}</div>
        <div>{r.preptime}</div>
        <div>{r.servings}</div>
        <div>{r.notes}</div>
        <div>{r.createdAt.toISOString()}</div>
      </section>
      <section>
        Ingredients
        <div>
          {ingredients.map((ingredient) => (
            <div key={ingredient.id}></div>
          ))}
        </div>
      </section>
      <section>
        Instructions
        <div>
          {instructions.map((instruction) => (
            <div key={instruction.id}></div>
          ))}
        </div>
      </section>
    </main>
  )
}
