import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { Calendar, ChefHat, Clock, Plus, Users, X } from 'lucide-react'
import type {
  Ingredient,
  IngredientInput,
  Instruction,
  Recipe,
} from '@/db/schema'
import { db } from '@/db'
import { ingredient, instruction, recipe } from '@/db/schema'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const COMMON_UNITS = [
  'cup',
  'cups',
  'tbsp',
  'tsp',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'l',
  'pinch',
  'whole',
  'other',
]

function RouteComponent() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [showIngredientForm, setShowIngredientForm] = useState(false)
  const [customUnit, setCustomUnit] = useState(false)

  if (!data.success) {
    return <div>{data.message}</div>
  }

  const defaultIngredient: Omit<IngredientInput, 'recipe'> = {
    name: '',
    amount: 0,
    unit: '',
  }

  const { recipe: r, ingredients, instructions } = data.data

  const ingredientForm = useForm({
    defaultValues: defaultIngredient,
    onSubmit: async ({ value }) => {
      const result = await addIngredient({ data: { ...value, recipe: r.id } })

      if (result.success) {
        setShowIngredientForm(false)
        setCustomUnit(false)
        ingredientForm.reset()
        router.invalidate()
      }
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          {r.title}
        </h1>
        {r.description && (
          <p className="text-muted-foreground mt-3 text-lg">{r.description}</p>
        )}
      </div>

      {/* Recipe Metadata */}
      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <div className="space-y-3 rounded-lg border bg-card p-6">
          <Label className="flex items-center gap-2 text-base">
            <Users className="size-5" />
            Servings
          </Label>
          <div className="text-2xl font-semibold">{r.servings}</div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-6">
          <Label className="flex items-center gap-2 text-base">
            <ChefHat className="size-5" />
            Prep Time
          </Label>
          <div className="text-2xl font-semibold">{r.preptime} min</div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-6">
          <Label className="flex items-center gap-2 text-base">
            <Clock className="size-5" />
            Cook Time
          </Label>
          <div className="text-2xl font-semibold">{r.cooktime} min</div>
        </div>
      </div>

      {/* Ingredients Section */}
      <section className="mb-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-tight">Ingredients</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIngredientForm(!showIngredientForm)}
          >
            {showIngredientForm ? (
              <>
                <X className="mr-2 size-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Add Ingredient
              </>
            )}
          </Button>
        </div>

        {showIngredientForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              ingredientForm.handleSubmit()
            }}
            className="space-y-4 rounded-lg border bg-card p-6"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <ingredientForm.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Ingredient Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Flour"
                    />
                  </div>
                )}
              />

              <ingredientForm.Field
                name="amount"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Amount</Label>
                    <Input
                      id={field.name}
                      type="number"
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.valueAsNumber)
                      }
                      placeholder="2"
                      step="0.01"
                    />
                  </div>
                )}
              />

              <ingredientForm.Field
                name="unit"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Unit</Label>
                    {customUnit ? (
                      <div className="flex gap-2">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g., cans"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setCustomUnit(false)
                            field.handleChange('')
                          }}
                          title="Back to common units"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => {
                          if (value === 'other') {
                            setCustomUnit(true)
                            field.handleChange('')
                          } else {
                            field.handleChange(value)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Add Ingredient</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIngredientForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {ingredients.length > 0 ? (
          <ul className="space-y-3">
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="text-muted-foreground flex items-baseline gap-3 text-lg"
              >
                <span className="text-foreground text-xl">•</span>
                <span>
                  {ingredient.amount && ingredient.unit && (
                    <span className="text-foreground font-medium">
                      {ingredient.amount} {ingredient.unit}{' '}
                    </span>
                  )}
                  {ingredient.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-base">
            No ingredients added yet
          </p>
        )}
      </section>

      {/* Instructions Section */}
      <section className="mb-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-tight">
            Instructions
          </h2>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 size-4" />
            Add Instruction
          </Button>
        </div>
        {instructions.length > 0 ? (
          <ol className="space-y-6">
            {instructions
              .sort((a, b) => a.order - b.order)
              .map((instruction, index) => (
                <li key={instruction.id} className="flex gap-5">
                  <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-foreground flex-1 pt-1 text-lg leading-relaxed">
                    {instruction.content}
                  </p>
                </li>
              ))}
          </ol>
        ) : (
          <p className="text-muted-foreground text-base">
            No instructions added yet
          </p>
        )}
      </section>

      {/* Notes Section */}
      {r.notes && (
        <section className="mb-12 space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Notes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap text-lg leading-relaxed">
            {r.notes}
          </p>
        </section>
      )}

      {/* Created Date */}
      <div className="text-muted-foreground flex items-center gap-2">
        <Calendar className="size-5" />
        <span className="text-base">
          Created{' '}
          {new Date(r.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}
