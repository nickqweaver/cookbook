import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { Check, CheckCircle2, ChevronLeft, Loader2, X } from 'lucide-react'
import type * as DbTypes from '@/db/schema'
import { db } from '@/db'
import { cook, cookInstruction } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation } from '@/hooks/use-mutation'

// Server function to update instruction checked status
export const updateInstructionChecked = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      cookId: number
      instructionId: number
      checked: boolean
      currentStep: number
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await db
        .update(cookInstruction)
        .set({ checked: data.checked })
        .where(
          and(
            eq(cookInstruction.cook, data.cookId),
            eq(cookInstruction.instruction, data.instructionId),
          ),
        )

      // Update the current step in cook
      await db
        .update(cook)
        .set({ currentStep: data.currentStep })
        .where(eq(cook.id, data.cookId))

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to update instruction',
      }
    }
  })

// Server function to complete the cook
export const completeCook = createServerFn({ method: 'POST' })
  .inputValidator((data: { cookId: number }) => data)
  .handler(async ({ data }) => {
    try {
      await db
        .update(cook)
        .set({
          status: 'completed',
          endedAt: new Date(),
        })
        .where(eq(cook.id, data.cookId))

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to complete cook',
      }
    }
  })

interface CookActiveStepProps {
  cookId: number
  currentStepIndex: number
  instructions: Array<
    DbTypes.Instruction & { checked: boolean; ingredientIds: Array<number> }
  >
  ingredients: Array<DbTypes.Ingredient & { checked: boolean }>
  onStepChange: (index: number) => void
  onComplete: () => void
}

export function CookActiveStep({
  cookId,
  currentStepIndex,
  instructions,
  ingredients,
  onStepChange,
  onComplete,
}: CookActiveStepProps) {
  const router = useRouter()
  const { mutate: updateInstruction } = useMutation(updateInstructionChecked)
  const { mutate: complete, isPending: isCompleting } =
    useMutation(completeCook)

  const currentInstruction = instructions[currentStepIndex]
  const currentIngredientIds = currentInstruction.ingredientIds
  const stepIngredients =
    currentIngredientIds.length > 0
      ? ingredients.filter((ing) => currentIngredientIds.includes(ing.id))
      : []

  const handleInstructionToggle = async (
    instructionId: number,
    checked: boolean,
    stepIndex: number,
  ) => {
    await updateInstruction(
      {
        data: {
          cookId,
          instructionId,
          checked,
          currentStep: stepIndex + 1,
        },
      },
      { onSuccess: () => router.invalidate() },
    )
  }

  const handleStepComplete = async () => {
    await handleInstructionToggle(currentInstruction.id, true, currentStepIndex)

    if (currentStepIndex === instructions.length - 1) {
      // Last step - complete the cook
      await complete(
        { data: { cookId } },
        {
          onSuccess: () => {
            router.invalidate()
            onComplete()
          },
        },
      )
    } else {
      onStepChange(currentStepIndex + 1)
    }
  }

  const handleStepIncomplete = async () => {
    await handleInstructionToggle(
      currentInstruction.id,
      false,
      currentStepIndex,
    )
  }

  if (!currentInstruction) return null

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Step {currentStepIndex + 1} of {instructions.length}
          </span>
          {currentInstruction.checked && (
            <button
              onClick={handleStepIncomplete}
              className="text-green-500 hover:text-red-500 flex items-center gap-1 text-sm font-normal transition-colors"
              title="Mark as incomplete"
            >
              <CheckCircle2 className="size-4" />
              Completed
              <X className="size-3 ml-1" />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Ingredients */}
        {stepIngredients.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">
              Ingredients for this step
            </h4>
            <ul className="space-y-1">
              {stepIngredients.map((ing) => (
                <li key={ing.id} className="text-base">
                  {ing.amount} {ing.unit} {ing.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instruction Content */}
        <p className="text-xl leading-relaxed">{currentInstruction.content}</p>

        {/* Step Actions - Previous and Complete */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="size-5 mr-1" />
            Previous
          </Button>

          <Button
            size="lg"
            onClick={handleStepComplete}
            disabled={isCompleting || currentInstruction.checked}
            className="px-8"
          >
            {isCompleting ? (
              <Loader2 className="size-5 animate-spin mr-2" />
            ) : (
              <Check className="size-5 mr-2" />
            )}
            {currentStepIndex === instructions.length - 1
              ? 'Finish Cooking'
              : 'Complete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
