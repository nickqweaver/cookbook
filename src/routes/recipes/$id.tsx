import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { useForm } from '@tanstack/react-form'
import { eq } from 'drizzle-orm'
import { Calendar, ChefHat, Clock, Pencil, Users, X, Check } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useMutation } from '@/hooks/use-mutation'

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

const updateRecipeNotes = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; notes: string | null }) => data)
  .handler(async ({ data }) => {
    try {
      await db
        .update(recipe)
        .set({ notes: data.notes })
        .where(eq(recipe.id, data.id))

      return {
        success: true,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update notes',
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
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const { mutate: updateNotes, isPending } = useMutation(updateRecipeNotes)
  const router = useRouter()

  const notesForm = useForm({
    defaultValues: {
      notes: recipe.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      await updateNotes(
        { data: { id: recipe.id, notes: value.notes || null } },
        {
          onSuccess: () => {
            router.invalidate()
            setIsEditingNotes(false)
          },
        },
      )
    },
  })

  const handleCancel = () => {
    notesForm.reset()
    setIsEditingNotes(false)
  }

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

      <section className="mb-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-tight">Notes</h2>
          {!isEditingNotes && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingNotes(true)}
            >
              <Pencil className="mr-2 size-4" />
              {recipe.notes ? 'Edit' : 'Add Notes'}
            </Button>
          )}
        </div>

        {isEditingNotes ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              notesForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <notesForm.Field
              name="notes"
              children={(field) => (
                <Textarea
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Add any notes, tips, or variations..."
                  rows={6}
                  className="text-base"
                />
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                <Check className="mr-2 size-4" />
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancel}
              >
                <X className="mr-2 size-4" />
                Cancel
              </Button>
            </div>
          </form>
        ) : recipe.notes ? (
          <p className="text-muted-foreground whitespace-pre-wrap text-lg leading-relaxed">
            {recipe.notes}
          </p>
        ) : (
          <p className="text-muted-foreground text-base italic">
            No notes added yet
          </p>
        )}
      </section>

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
