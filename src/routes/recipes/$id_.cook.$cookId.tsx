import { useEffect, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { type CookPhase } from './_cook/cook-header'
import { CookHeader } from './_cook/cook-header'
import { CookActiveStep } from './_cook/cook-active-step'
import { CookIngredientChecklist } from './_cook/cook-ingredient.checklist'
import { CookStepOverview } from './_cook/cook-step-overview'
import { CookComplete } from './_cook/cook-complete'
import { Button } from '@/components/ui/button'
import { db } from '@/db'
import {
  cook,
  cookIngredient,
  cookInstruction,
  ingredient,
  instruction,
  instructionIngredient,
  recipe,
} from '@/db/schema'
// Server function to get cook session data
const getCookSession = createServerFn({ method: 'GET' })
  .inputValidator((data: { recipeId: string; cookId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // TODO: cleanup this vibed mess of data fetching, should be able to consolidate and fetch in parallel
      const recipeId = parseInt(data.recipeId)
      const cookId = parseInt(data.cookId)

      if (isNaN(recipeId) || isNaN(cookId)) {
        throw new Error('Invalid IDs provided')
      }

      // Get the cook session
      const [cookSession] = await db
        .select()
        .from(cook)
        .where(and(eq(cook.id, cookId), eq(cook.recipe, recipeId)))

      if (!cookSession) {
        throw new Error('Cook session not found')
      }

      // Get the recipe
      const [recipeData] = await db
        .select()
        .from(recipe)
        .where(eq(recipe.id, recipeId))

      if (!recipeData) {
        throw new Error('Recipe not found')
      }

      // Get ingredients with their cook status
      const ingredientsData = await db
        .select({
          ingredient: ingredient,
          cookIngredient: cookIngredient,
        })
        .from(ingredient)
        .leftJoin(
          cookIngredient,
          and(
            eq(cookIngredient.ingredient, ingredient.id),
            eq(cookIngredient.cook, cookId),
          ),
        )
        .where(eq(ingredient.recipe, recipeId))

      // Get instructions with their cook status
      const instructionsData = await db
        .select({
          instruction: instruction,
          cookInstruction: cookInstruction,
        })
        .from(instruction)
        .leftJoin(
          cookInstruction,
          and(
            eq(cookInstruction.instruction, instruction.id),
            eq(cookInstruction.cook, cookId),
          ),
        )
        .where(eq(instruction.recipe, recipeId))
        .orderBy(instruction.order)

      // Get instruction-ingredient mappings
      const instructionIngredientMappings = await db
        .select({
          instructionId: instructionIngredient.instruction,
          ingredientId: instructionIngredient.ingredient,
        })
        .from(instructionIngredient)
        .innerJoin(
          instruction,
          eq(instructionIngredient.instruction, instruction.id),
        )
        .where(eq(instruction.recipe, recipeId))

      // Group ingredient IDs by instruction ID
      const ingredientsByInstruction = new Map<number, Array<number>>()
      for (const mapping of instructionIngredientMappings) {
        const existing =
          ingredientsByInstruction.get(mapping.instructionId) ?? []
        existing.push(mapping.ingredientId)
        ingredientsByInstruction.set(mapping.instructionId, existing)
      }

      return {
        success: true,
        data: {
          cook: cookSession,
          recipe: recipeData,
          ingredients: ingredientsData.map((row) => ({
            ...row.ingredient,
            checked: row.cookIngredient?.checked ?? false,
            cookIngredientId: row.cookIngredient?.id,
          })),
          instructions: instructionsData.map((row) => ({
            ...row.instruction,
            checked: row.cookInstruction?.checked ?? false,
            cookInstructionId: row.cookInstruction?.id,
            ingredientIds:
              ingredientsByInstruction.get(row.instruction.id) ?? [],
          })),
        },
      }
    } catch (err) {
      console.error(err)
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to get cook session',
      }
    }
  })

export const Route = createFileRoute('/recipes/$id_/cook/$cookId')({
  component: CookComponent,
  loader: async ({ params }) =>
    await getCookSession({
      data: { recipeId: params.id, cookId: params.cookId },
    }),
})

function CookComponent() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { id: recipeId } = Route.useParams()

  // Compute initial state from loader data
  const getInitialState = () => {
    if (!data.success)
      return { phase: 'ingredients' as CookPhase, stepIndex: 0 }

    const { cook: cookData, ingredients } = data.data
    const allIngredientsChecked = ingredients.every((ing) => ing.checked)

    if (cookData.status === 'completed') {
      return { phase: 'completed' as CookPhase, stepIndex: 0 }
    } else if (allIngredientsChecked) {
      return {
        phase: 'cooking' as CookPhase,
        stepIndex: cookData.currentStep - 1,
      }
    } else {
      return { phase: 'ingredients' as CookPhase, stepIndex: 0 }
    }
  }

  const [phase, setPhase] = useState<CookPhase>(getInitialState().phase)
  const [currentStepIndex, setCurrentStepIndex] = useState(
    getInitialState().stepIndex,
  )

  // Only update phase when cook status changes to completed
  useEffect(() => {
    if (!data.success) return

    const { cook: cookData } = data.data
    if (cookData.status === 'completed') {
      setPhase('completed')
    }
  }, [data])

  if (!data.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Error</h1>
          <p className="text-muted-foreground mt-2">{data.message}</p>
          <Button asChild className="mt-4">
            <Link to="/recipes/$id" params={{ id: recipeId }}>
              Back to Recipe
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const {
    cook: cookData,
    recipe: recipeData,
    ingredients,
    instructions,
  } = data.data

  const views: Record<CookPhase, React.ReactNode> = {
    ingredients: (
      <CookIngredientChecklist
        cookId={cookData.id}
        ingredients={ingredients}
        onStartCooking={() => setPhase('cooking')}
      />
    ),
    cooking: (
      <div className="space-y-6">
        <CookActiveStep
          cookId={cookData.id}
          currentStepIndex={currentStepIndex}
          instructions={instructions}
          ingredients={ingredients}
          onStepChange={setCurrentStepIndex}
          onComplete={() => setPhase('completed')}
        />
      </div>
    ),
    completed: (
      <CookComplete
        recipeId={recipeId}
        recipeTitle={recipeData.title}
        cookId={cookData.id}
        cookCreatedAt={cookData.createdAt}
        cookEndedAt={cookData.endedAt}
        onReopened={() => {
          setPhase('cooking')
          setCurrentStepIndex(instructions.length - 1)
        }}
      />
    ),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-4">
      {/* Header */}
      <CookHeader
        recipeId={recipeId}
        recipeTitle={recipeData.title}
        cookId={cookData.id}
        cookStatus={cookData.status}
        cookCreatedAt={cookData.createdAt}
        phase={phase}
        currentStepIndex={currentStepIndex}
        instructions={instructions}
        onStepSelect={setCurrentStepIndex}
        onCancelSuccess={() => {
          router.navigate({ to: '/recipes/$id', params: { id: recipeId } })
        }}
      />
      {views[phase]}
      <CookStepOverview
        instructions={instructions}
        currentStepIndex={currentStepIndex}
        onStepSelect={setCurrentStepIndex}
      />
    </div>
  )
}
