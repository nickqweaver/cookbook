import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import {
  Calendar,
  Check,
  ChefHat,
  Clock,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Ingredients } from './_ingredients/ingredients'
import type {
  Ingredient,
  IngredientInput,
  Instruction,
  InstructionInput,
  Recipe,
} from '@/db/schema'
import { db } from '@/db'
import { ingredient, instruction, recipe } from '@/db/schema'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

        if (!acc.ingredients.some((ing) => ing.id === curr.ingredient?.id)) {
          console.log(acc.ingredients, curr.ingredient)
          return {
            ...acc,
            ingredients: curr.ingredient
              ? [...acc.ingredients, curr.ingredient]
              : acc.ingredients,
          }
        }

        if (!acc.instructions.some((ins) => ins.id === curr.instruction?.id)) {
          return {
            ...acc,
            instructions: curr.instruction
              ? [...acc.instructions, curr.instruction]
              : acc.instructions,
          }
        }
        return {
          ...acc,
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
          err instanceof Error ? err.message : 'Failed to add ingredient',
      }
    }
  })

const addInstruction = createServerFn({ method: 'POST' })
  .inputValidator((data: InstructionInput) => data)
  .handler(async ({ data }) => {
    await new Promise((res) => setTimeout(res, 2000))
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

type InstructionsProps = {
  instructions: Array<Instruction>
  recipeId: number
}

function Instructions({ instructions, recipeId }: InstructionsProps) {
  const router = useRouter()
  const [showInstructionForm, setShowInstructionForm] = useState(false)
  const [editingInstructionId, setEditingInstructionId] = useState<
    number | null
  >(null)
  const [deletingInstructionId, setDeletingInstructionId] = useState<
    number | null
  >(null)

  const sortedInstructions = [...instructions].sort((a, b) => a.order - b.order)
  const nextOrder =
    sortedInstructions.length > 0
      ? sortedInstructions[sortedInstructions.length - 1].order + 1
      : 1

  const defaultInstruction = {
    content: '',
    order: nextOrder,
  }
  const add = useServerFn(addInstruction)
  const mutation = useMutation(add)

  const instructionForm = useForm({
    defaultValues: defaultInstruction,
    onSubmit: async ({ value }) => {
      const result = await mutation.mutate({
        data: { ...value, recipe: recipeId },
      })

      if (result?.success) {
        setShowInstructionForm(false)
        instructionForm.reset()
        router.invalidate()
      }
    },
  })

  return (
    <section className="mb-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Instructions</h2>
        <Dialog
          open={showInstructionForm}
          onOpenChange={setShowInstructionForm}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 size-4" />
              Add Instruction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Instruction</DialogTitle>
              <DialogDescription>
                Add a new step to your recipe instructions
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                instructionForm.handleSubmit()
              }}
              className="space-y-4"
            >
              <instructionForm.Field
                name="content"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Instruction</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Describe this step in detail..."
                      rows={4}
                    />
                  </div>
                )}
              />

              <instructionForm.Field
                name="order"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Step Number</Label>
                    <Input
                      id={field.name}
                      type="number"
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.valueAsNumber)
                      }
                      min={1}
                    />
                  </div>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInstructionForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? 'Adding Instruction...'
                    : 'Add Instruction'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedInstructions.length > 0 ? (
        <ol className="space-y-4">
          {sortedInstructions.map((instructionItem, index) => {
            const isEditing = editingInstructionId === instructionItem.id

            return (
              <li
                key={instructionItem.id}
                className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                {isEditing ? (
                  <div className="flex flex-1 gap-3">
                    <Input
                      type="number"
                      defaultValue={instructionItem.order}
                      className="w-16 text-center"
                      min={1}
                    />
                    <div className="flex flex-1 flex-col gap-3">
                      <Textarea
                        defaultValue={instructionItem.content}
                        placeholder="Instruction content"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Save logic will go here
                            setEditingInstructionId(null)
                          }}
                        >
                          <Check className="mr-2 size-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingInstructionId(null)}
                        >
                          <X className="mr-2 size-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-foreground flex-1 pt-1 text-lg leading-relaxed">
                      {instructionItem.content}
                    </p>
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
                        onClick={() =>
                          setEditingInstructionId(instructionItem.id)
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeletingInstructionId(instructionItem.id)
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-muted-foreground text-base">
          No instructions added yet
        </p>
      )}

      <Dialog
        open={deletingInstructionId !== null}
        onOpenChange={(open) => !open && setDeletingInstructionId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Instruction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this instruction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingInstructionId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Delete logic will go here
                console.log('Delete instruction', deletingInstructionId)
                setDeletingInstructionId(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function RouteComponent() {
  const data = Route.useLoaderData()

  if (!data.success) {
    return <div>{data.message}</div>
  }

  const { recipe, ingredients, instructions } = data.data

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <RecipeHeader recipe={recipe} />
      <Ingredients
        ingredients={ingredients}
        recipeId={recipe.id}
        addIngredientFn={addIngredient}
      />
      <Instructions instructions={instructions} recipeId={recipe.id} />
    </div>
  )
}
