import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Loader2, Play } from 'lucide-react'
import type { Ingredient, Instruction } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { useMutation } from '@/hooks/use-mutation'
import { cook, cookIngredient, cookInstruction } from '@/db/schema'
import { db } from '@/db'

type StartCookButtonProps = {
  recipeId: number
  ingredients: Array<Ingredient>
  instructions: Array<Instruction>
}

const startCook = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      recipeId: number
      ingredients: Array<Ingredient>
      instructions: Array<Instruction>
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      // Create the cook session
      const [newCook] = await db
        .insert(cook)
        .values({
          recipe: data.recipeId,
          status: 'in_progress',
          currentStep: 1,
        })
        .returning()

      const inserts = []

      if (data.ingredients.length > 0) {
        inserts.push(
          db.insert(cookIngredient).values(
            data.ingredients.map((ing) => ({
              cook: newCook.id,
              ingredient: ing.id,
              checked: false,
            })),
          ),
        )
      }
      if (data.instructions.length > 0) {
        inserts.push(
          db.insert(cookInstruction).values(
            data.instructions.map((ins) => ({
              cook: newCook.id,
              instruction: ins.id,
              checked: false,
            })),
          ),
        )
      }

      await Promise.all(inserts)

      return {
        success: true,
        cookId: newCook.id,
      }
    } catch (err) {
      console.error(err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to start cook',
      }
    }
  })

export function CookStartButton({
  recipeId,
  ingredients,
  instructions,
}: StartCookButtonProps) {
  const router = useRouter()
  const { mutate: start, isPending } = useMutation(startCook)

  const handleStartCook = async () => {
    await start(
      { data: { recipeId, ingredients, instructions } },
      {
        onSuccess: (result) => {
          if (result.success && result.cookId) {
            router.navigate({
              to: '/recipes/$id/cook/$cookId',
              params: {
                id: String(recipeId),
                cookId: String(result.cookId),
              },
            })
          }
        },
      },
    )
  }

  return (
    <Button
      onClick={handleStartCook}
      disabled={isPending}
      size="lg"
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Play className="size-5" />
      )}
      {isPending ? 'Starting...' : 'Start Cook'}
    </Button>
  )
}
