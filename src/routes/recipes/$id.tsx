import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { Calendar, ChefHat, Clock, Users } from 'lucide-react'
import { Ingredients } from './_ingredients/ingredients'
import { Instructions } from './_instructions/instructions'
import type {
  Ingredient,
  Instruction,
  InstructionInput,
  Recipe,
} from '@/db/schema'
import { db } from '@/db'
import { ingredient, instruction, recipe } from '@/db/schema'
import { Label } from '@/components/ui/label'

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

        const needsIngredient =
          curr.ingredient &&
          !acc.ingredients.some((ing) => ing.id === curr.ingredient?.id)
        const needsInstruction =
          curr.instruction &&
          !acc.instructions.some((ins) => ins.id === curr.instruction?.id)

        return {
          ...acc,
          ingredients:
            needsIngredient && curr.ingredient
              ? [...acc.ingredients, curr.ingredient]
              : acc.ingredients,
          instructions:
            needsInstruction && curr.instruction
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

const addInstruction = createServerFn({ method: 'POST' })
  .inputValidator((data: InstructionInput) => data)
  .handler(async ({ data }) => {
    try {
      const [insert] = await db.insert(instruction).values(data).returning()

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

type RecipeHeaderProps = {
  recipe: Recipe
}

function RecipeHeader({ recipe }: RecipeHeaderProps) {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          {recipe.title}
        </h1>
        {recipe.description && (
          <p className="text-muted-foreground mt-3 text-lg">
            {recipe.description}
          </p>
        )}
      </div>

      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <div className="space-y-3 rounded-lg border bg-card p-6">
          <Label className="flex items-center gap-2 text-base">
            <Users className="size-5" />
            Servings
          </Label>
          <div className="text-2xl font-semibold">{recipe.servings}</div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-6">
          <Label className="flex items-center gap-2 text-base">
            <ChefHat className="size-5" />
            Prep Time
          </Label>
          <div className="text-2xl font-semibold">{recipe.preptime} min</div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-6">
          <Label className="flex items-center gap-2 text-base">
            <Clock className="size-5" />
            Cook Time
          </Label>
          <div className="text-2xl font-semibold">{recipe.cooktime} min</div>
        </div>
      </div>

      {recipe.notes && (
        <section className="mb-12 space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Notes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap text-lg leading-relaxed">
            {recipe.notes}
          </p>
        </section>
      )}

      <div className="text-muted-foreground mb-12 flex items-center gap-2">
        <Calendar className="size-5" />
        <span className="text-base">
          Created{' '}
          {new Date(recipe.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
    </>
  )
}

function RouteComponent() {
  const data = Route.useLoaderData()
  const addIns = useServerFn(addInstruction)

  if (!data.success) {
    return <div>{data.message}</div>
  }

  const { recipe, ingredients, instructions } = data.data

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <RecipeHeader recipe={recipe} />
      <Ingredients ingredients={ingredients} recipeId={recipe.id} />
      <Instructions
        instructions={instructions}
        recipeId={recipe.id}
        addInstructionFn={addIns}
      />
    </div>
  )
}
