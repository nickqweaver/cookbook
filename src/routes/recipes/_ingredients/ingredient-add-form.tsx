import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import type { IngredientInput } from '@/db/schema'
import { ingredient } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useMutation } from '@/hooks/use-mutation'
import { db } from '@/db'

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

type IngredientAddFormProps = {
  recipeId: number
}

export function IngredientAddForm({ recipeId }: IngredientAddFormProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [customUnit, setCustomUnit] = useState(false)

  const mutation = useMutation(useServerFn(addIngredient))

  const defaultIngredient: Omit<IngredientInput, 'recipe'> = {
    name: '',
    amount: 0,
    unit: '',
  }

  const ingredientForm = useForm({
    defaultValues: defaultIngredient,
    onSubmit: async ({ value }) => {
      const result = await mutation.mutate({
        data: { ...value, recipe: recipeId },
      })

      if (result?.success) {
        setShowForm(false)
        setCustomUnit(false)
        ingredientForm.reset()
        router.invalidate()
      }
    },
  })

  return (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 size-4" />
          Add Ingredient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
          <DialogDescription>
            Add a new ingredient to your recipe
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            ingredientForm.handleSubmit()
          }}
          className="space-y-4"
        >
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

          <div className="grid gap-4 sm:grid-cols-2">
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
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Ingredient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
