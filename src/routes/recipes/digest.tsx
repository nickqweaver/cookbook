import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { AlertCircle, Sparkles, X } from 'lucide-react'
import type {
  IngredientInput,
  InstructionInput,
  RecipeInput,
} from '@/db/schema'
import { ingredient, instruction, recipe } from '@/db/schema'
import { db } from '@/db'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMutation } from '@/hooks/use-mutation'

export const Route = createFileRoute('/recipes/digest')({
  component: RouteComponent,
})

export type Payload = RecipeInput & {
  instructions: Array<InstructionInput>
  ingredients: Array<IngredientInput>
}

const digestRecipe = createServerFn({ method: 'POST' })
  .inputValidator((data: Payload) => {
    if (
      typeof data.preptime !== 'number' ||
      typeof data.cooktime !== 'number' ||
      typeof data.servings !== 'number' ||
      typeof data.title !== 'string' ||
      typeof data.instructions !== 'object' ||
      typeof data.ingredients !== 'object'
    ) {
      throw new Error('Missing required fields')
    }

    return data
  })
  .handler(async ({ data }) => {
    try {
      const transaction = await db.transaction(async (tx) => {
        try {
          const { ingredients: ing, instructions: ins, ...rest } = data
          const [r] = await tx.insert(recipe).values(rest).returning()

          const ig = ing.map((i) => ({ ...i, recipe: r.id }))
          const inst = ins.map((i) => ({ ...i, recipe: r.id }))
          await Promise.all([
            tx.insert(ingredient).values(ig),
            tx.insert(instruction).values(inst),
          ])

          return r
        } catch (err) {
          console.error('Transaction failed, rolling back')
          throw new Error(
            err instanceof Error ? err.message : 'Failed to Digest Recipe!',
          )
        }
      })

      return {
        success: true,
        data: transaction,
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
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { mutate: digest, isPending } = useMutation(useServerFn(digestRecipe))

  const handleDigest = () => {
    setError(null)

    if (!jsonInput.trim()) {
      setError('Please paste the AI response JSON')
      return
    }

    try {
      const parsed = JSON.parse(jsonInput) as Payload

      // Basic validation
      if (
        !parsed.title ||
        !parsed.servings ||
        !parsed.preptime ||
        !parsed.cooktime
      ) {
        setError(
          'Invalid recipe data: missing required fields (title, servings, preptime, cooktime)',
        )
        return
      }

      if (
        !Array.isArray(parsed.ingredients) ||
        parsed.ingredients.length === 0
      ) {
        setError('Invalid recipe data: must have at least one ingredient')
        return
      }

      if (
        !Array.isArray(parsed.instructions) ||
        parsed.instructions.length === 0
      ) {
        setError('Invalid recipe data: must have at least one instruction')
        return
      }

      // Call the server function
      digest(
        { data: parsed },
        {
          onSuccess: (result: any) => {
            if (result.success && result.data) {
              navigate({ to: `/recipes/${result.data.id}` })
            } else {
              setError(result.message || 'Failed to create recipe')
            }
          },
          onError: (errMsg) => {
            setError(errMsg)
          },
        },
      )
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(
          'Invalid JSON format. Please make sure you copied the complete JSON response from the AI.',
        )
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to parse recipe data',
        )
      }
    }
  }

  const handleClear = () => {
    setJsonInput('')
    setError(null)
  }

  // Try to parse and show preview info
  let previewInfo: {
    title?: string
    ingredientCount?: number
    instructionCount?: number
  } = {}
  try {
    if (jsonInput.trim()) {
      const parsed = JSON.parse(jsonInput) as Payload
      previewInfo = {
        title: parsed.title,
        ingredientCount: parsed.ingredients.length || 0,
        instructionCount: parsed.instructions.length || 0,
      }
    }
  } catch {
    // Ignore parse errors for preview
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          Digest Recipe
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Transform stolen data into your personal collection
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-6 rounded-lg border bg-card p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="json-input">AI Response (JSON)</Label>
              {jsonInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <X className="mr-1 size-3" />
                  Clear
                </Button>
              )}
            </div>
            <Textarea
              id="json-input"
              placeholder="Paste the JSON response from your AI here..."
              className="font-mono text-sm"
              rows={20}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value)
                setError(null)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Paste the complete JSON response from ChatGPT, Claude, or your AI
              of choice
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {previewInfo.title && !error && (
            <div className="rounded-lg border bg-muted p-4">
              <h3 className="font-semibold mb-2">Preview</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Recipe:</span>{' '}
                  <span className="font-medium">{previewInfo.title}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Ingredients:</span>{' '}
                  {previewInfo.ingredientCount}
                </p>
                <p>
                  <span className="text-muted-foreground">Instructions:</span>{' '}
                  {previewInfo.instructionCount} steps
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              size="lg"
              onClick={handleDigest}
              disabled={!jsonInput.trim() || isPending}
            >
              <Sparkles className="mr-2 size-5" />
              {isPending ? 'Adding to Collection...' : 'Add to Collection'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleClear}
              disabled={isPending}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
