import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ChefHat, Clock, Users } from 'lucide-react'
import type { RecipeInsert } from '@/db/schema'
import { db } from '@/db'
import { recipe } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/recipes/create')({
  component: RouteComponent,
})

const createRecipe = createServerFn({ method: 'POST' })
  .inputValidator((data: RecipeInsert) => {
    if (
      typeof data.preptime !== 'number' ||
      typeof data.cooktime !== 'number' ||
      typeof data.servings !== 'number' ||
      typeof data.title !== 'string'
    ) {
      throw new Error('Missing required fields')
    }

    return data
  })
  .handler(async ({ data }) => {
    try {
      const [inserted] = await db.insert(recipe).values(data).returning()
      return {
        success: true,
        data: inserted,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to create recipe',
      }
    }
  })

function RouteComponent() {
  const navigate = useNavigate()

  const defaultValues: RecipeInsert = {
    title: '',
    description: '',
    servings: 4,
    preptime: 30,
    cooktime: 30,
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await createRecipe({ data: value })
      if (result.success) {
        navigate({ to: `/recipes/${result.data.id}` })
      }
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          Create Recipe
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Add a new recipe to your collection
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-8"
      >
        <div className="space-y-6">
          <form.Field
            name="title"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Recipe Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Grandma's Chocolate Chip Cookies"
                  className="text-base"
                />
              </div>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="A brief description of this recipe..."
                  rows={3}
                />
              </div>
            )}
          />

          <div className="grid gap-6 sm:grid-cols-3">
            <form.Field
              name="servings"
              children={(field) => (
                <div className="space-y-2">
                  <Label
                    htmlFor={field.name}
                    className="flex items-center gap-2"
                  >
                    <Users className="size-4" />
                    Servings
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    min={1}
                  />
                </div>
              )}
            />

            <form.Field
              name="preptime"
              children={(field) => (
                <div className="space-y-2">
                  <Label
                    htmlFor={field.name}
                    className="flex items-center gap-2"
                  >
                    <ChefHat className="size-4" />
                    Prep (min)
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    min={0}
                  />
                </div>
              )}
            />

            <form.Field
              name="cooktime"
              children={(field) => (
                <div className="space-y-2">
                  <Label
                    htmlFor={field.name}
                    className="flex items-center gap-2"
                  >
                    <Clock className="size-4" />
                    Cook (min)
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    min={0}
                  />
                </div>
              )}
            />
          </div>

          <form.Field
            name="notes"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Any additional notes, tips, or variations..."
                  rows={4}
                />
              </div>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" size="lg">
            Create Recipe
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate({ to: '/recipes' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
