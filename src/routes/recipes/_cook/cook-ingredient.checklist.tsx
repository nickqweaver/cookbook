import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { Check, ChevronRight, Loader2 } from 'lucide-react'
import type * as DbTypes from '@/db/schema'
import { cookIngredient } from '@/db/schema'
import { db } from '@/db'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation } from '@/hooks/use-mutation'

// Server function to update ingredient checked status
export const updateIngredientChecked = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { cookId: number; ingredientId: number; checked: boolean }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await db
        .update(cookIngredient)
        .set({ checked: data.checked })
        .where(
          and(
            eq(cookIngredient.cook, data.cookId),
            eq(cookIngredient.ingredient, data.ingredientId),
          ),
        )

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to update ingredient',
      }
    }
  })

// Server function to check all ingredients
export const checkAllIngredients = createServerFn({ method: 'POST' })
  .inputValidator((data: { cookId: number }) => data)
  .handler(async ({ data }) => {
    try {
      await db
        .update(cookIngredient)
        .set({ checked: true })
        .where(eq(cookIngredient.cook, data.cookId))

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : 'Failed to check all ingredients',
      }
    }
  })

interface CookIngredientChecklistProps {
  cookId: number
  ingredients: Array<DbTypes.Ingredient & { checked: boolean }>
  onStartCooking: () => void
}

export function CookIngredientChecklist({
  cookId,
  ingredients,
  onStartCooking,
}: CookIngredientChecklistProps) {
  const router = useRouter()
  const { mutate: updateIngredient } = useMutation(updateIngredientChecked)
  const { mutate: checkAll, isPending: isCheckingAll } =
    useMutation(checkAllIngredients)

  const allIngredientsChecked = ingredients.every((ing) => ing.checked)

  const handleIngredientToggle = async (
    ingredientId: number,
    checked: boolean,
  ) => {
    await updateIngredient(
      { data: { cookId, ingredientId, checked } },
      { onSuccess: () => router.invalidate() },
    )
  }

  const handleCheckAllIngredients = async () => {
    await checkAll(
      { data: { cookId } },
      {
        onSuccess: () => {
          router.invalidate()
          onStartCooking()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ingredient Checklist</span>
            <span className="text-sm font-normal text-muted-foreground">
              {ingredients.filter((i) => i.checked).length} /{' '}
              {ingredients.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Check off the ingredients you have ready before starting to cook.
          </p>

          <div className="space-y-3">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`ingredient-${ing.id}`}
                  checked={ing.checked}
                  onCheckedChange={(checked) =>
                    handleIngredientToggle(ing.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`ingredient-${ing.id}`}
                  className={`text-base cursor-pointer ${
                    ing.checked ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {ing.amount} {ing.unit} {ing.name}
                </Label>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCheckAllIngredients}
              disabled={isCheckingAll}
              className="flex-1"
            >
              {isCheckingAll ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Check className="size-4 mr-2" />
              )}
              I Have All Ingredients
            </Button>

            {allIngredientsChecked && (
              <Button
                onClick={onStartCooking}
                variant="default"
                className="flex-1"
              >
                Start Cooking
                <ChevronRight className="size-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
