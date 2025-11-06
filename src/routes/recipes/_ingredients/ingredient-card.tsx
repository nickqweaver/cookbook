import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { IngredientDelete } from './ingredient-delete'
import type { Ingredient, IngredientInput } from '@/db/schema'
import { ingredient } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from '@/hooks/use-mutation'
import { db } from '@/db'
import { useRouter } from '@tanstack/react-router'

type IngredientCardProps = {
  ingredient: Ingredient
}

const deleteIngredient = createServerFn({ method: 'POST' })
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(ingredient).where(eq(ingredient.id, data))

      return {
        success: true,
      }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to delete ingredient',
      }
    }
  })

const editIngredient = createServerFn({ method: 'POST' })
  .inputValidator((data: Partial<IngredientInput> & { id: number }) => data)
  .handler(async ({ data }) => {
    try {
      await db.update(ingredient).set(data).where(eq(ingredient.id, data.id))

      return {
        success: true,
        updatedFields: Object.keys(data),
      }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to update ingredient',
      }
    }
  })

export function IngredientCard({ ingredient }: IngredientCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [deletingIngredientId, setDeletingIngredientId] = useState<
    number | null
  >(null)
  const { mutate: edit, isPending } = useMutation(editIngredient)
  const { mutate: delIngredient } = useMutation(useServerFn(deleteIngredient))
  const router = useRouter()

  const defaultIngredient: Partial<IngredientInput> = {
    name: ingredient.name,
    amount: ingredient.amount,
    unit: ingredient.unit,
  }

  const ingredientForm = useForm({
    defaultValues: defaultIngredient,
    onSubmit: async ({ value }) => {
      await edit(
        { data: { ...value, id: ingredient.id } },
        { onSuccess: () => router.invalidate() },
      )
      setIsEditing(false)
    },
  })

  const handleCancel = () => {
    ingredientForm.reset()
    setIsEditing(false)
  }

  return (
    <li className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      {isEditing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            ingredientForm.handleSubmit()
          }}
          className="flex flex-1 items-center gap-3"
        >
          <ingredientForm.Field
            name="name"
            children={(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ingredient name"
                className="flex-1"
              />
            )}
          />
          <ingredientForm.Field
            name="amount"
            children={(field) => (
              <Input
                type="number"
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                placeholder="Amount"
                step="0.01"
                className="w-24"
              />
            )}
          />
          <ingredientForm.Field
            name="unit"
            children={(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Unit"
                className="w-24"
              />
            )}
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              disabled={isPending}
            >
              <Check className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              onClick={handleCancel}
            >
              <X className="size-4" />
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex-1">
            <span className="text-foreground text-lg">
              {ingredient.amount && ingredient.unit && (
                <span className="font-semibold">
                  {ingredient.amount} {ingredient.unit}{' '}
                </span>
              )}
              {ingredient.name}
            </span>
          </div>
          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => setDeletingIngredientId(ingredient.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      )}
      <IngredientDelete
        isOpen={deletingIngredientId !== null}
        onClose={() => setDeletingIngredientId(null)}
        onConfirm={() => {
          setDeletingIngredientId(null)
          delIngredient(
            { data: deletingIngredientId as number },
            { onSuccess: () => router.invalidate() },
          )
        }}
      />
    </li>
  )
}
