import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, Check, Copy, X } from 'lucide-react'
import type {
  IngredientInput,
  InstructionInput,
  RecipeInput,
} from '@/db/schema'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

type StealSearch = {
  url?: string
}

export const Route = createFileRoute('/recipes/steal')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): StealSearch => {
    return {
      url: typeof search?.url === 'string' ? search.url : undefined,
    }
  },
})

export type Payload = RecipeInput & {
  instructions: Array<InstructionInput>
  ingredients: Array<IngredientInput>
}

export const JSON_SCHEMA = `{
  "title": "string (required) - The name of the recipe",
  "description": "string | null (optional) - A brief description of the recipe",
  "servings": "number (required) - Number of servings this recipe makes (default: 1)",
  "preptime": "number (required) - Preparation time in minutes",
  "cooktime": "number (required) - Cooking time in minutes",
  "notes": "string | null (optional) - Any additional notes, tips, or variations",
  "ingredients": [
    {
      "name": "string (required) - Name of the ingredient",
      "amount": "number (required) - Quantity/amount of the ingredient",
      "unit": "string (required) - Unit of measurement (e.g., 'cup', 'tbsp', 'oz', 'g')"
    }
  ],
  "instructions": [
    {
      "order": "number (required) - Step number (1, 2, 3, etc.)",
      "content": "string (required) - The instruction text for this step"
    }
  ]
}`

export const craftPrompt = (
  url: string,
) => `You are an expert recipe extraction assistant. Your task is to analyze the recipe from the provided URL and extract all relevant information into a structured JSON format.

# URL to Process:
${url}

# Your Mission:
Extract the recipe data from the webpage content and filter out all the unnecessary blog content, ads, life stories, and other nonsense that recipe sites are notorious for. Focus ONLY on the actual recipe information.

# Extraction Guidelines:

## Recipe Basics:
- Extract the exact recipe title (clean, no extra punctuation)
- Create a concise 1-2 sentence description if one exists
- Identify the number of servings/yield
- Extract prep time and cook time in minutes (convert hours to minutes if needed)
- Capture any helpful notes, tips, storage instructions, or variations

## Ingredients:
- Parse each ingredient with its amount, unit, and name
- Convert all fractional amounts to decimal numbers (e.g., "1/2" → 0.5, "1 1/4" → 1.25)
- Use standard abbreviations for units: cup, tbsp, tsp, oz, lb, g, kg, ml, l
- For counted items use "whole" or "piece" (e.g., "2 eggs" → amount: 2, unit: "whole")
- Keep ingredient names descriptive: "all-purpose flour" not just "flour"
- Remove any preparation notes from ingredient names (move to instructions if important)

## Instructions:
- Number each step sequentially starting from 1
- Keep the original instruction text but clean up HTML artifacts
- Each step should be a complete, actionable instruction
- Preserve important details like temperatures, times, and techniques

## Default Values (use only if information is missing):
- servings: 4
- preptime: 30
- cooktime: 30
- description: null
- notes: null

## Time Handling:
- If a range is given (e.g., "30-40 minutes"), use the middle value (35) or first value (30)
- Convert all times to minutes (e.g., "1 hour 30 minutes" → 90)
- Total time should be split into prep and cook if possible

# CRITICAL OUTPUT REQUIREMENTS:
Return the extracted recipe data as a JSON object wrapped in a markdown code block for easy copying.

Format your response EXACTLY like this:
\`\`\`json
{
  "title": "...",
  "description": "...",
  ...
}
\`\`\`

DO NOT include:
- Any explanatory text before or after the code block
- Multiple code blocks
- Any commentary within the JSON

Your entire response should be a single markdown JSON code block matching this schema:

${JSON_SCHEMA}

# Example Output:
{
  "title": "Classic Chocolate Chip Cookies",
  "description": "Soft and chewy homemade chocolate chip cookies with crispy edges",
  "servings": 24,
  "preptime": 15,
  "cooktime": 12,
  "notes": "For chewier cookies, slightly underbake. Store in airtight container up to 5 days. Can freeze dough for up to 3 months.",
  "ingredients": [
    { "name": "all-purpose flour", "amount": 2.25, "unit": "cup" },
    { "name": "unsalted butter, softened", "amount": 1, "unit": "cup" },
    { "name": "granulated sugar", "amount": 0.75, "unit": "cup" },
    { "name": "brown sugar, packed", "amount": 0.75, "unit": "cup" },
    { "name": "large eggs", "amount": 2, "unit": "whole" },
    { "name": "vanilla extract", "amount": 2, "unit": "tsp" },
    { "name": "baking soda", "amount": 1, "unit": "tsp" },
    { "name": "salt", "amount": 1, "unit": "tsp" },
    { "name": "semi-sweet chocolate chips", "amount": 2, "unit": "cup" }
  ],
  "instructions": [
    { "order": 1, "content": "Preheat oven to 375°F (190°C). Line baking sheets with parchment paper." },
    { "order": 2, "content": "In a large bowl, cream together softened butter and both sugars until light and fluffy, about 3-4 minutes." },
    { "order": 3, "content": "Beat in eggs one at a time, then stir in vanilla extract." },
    { "order": 4, "content": "In a separate bowl, whisk together flour, baking soda, and salt." },
    { "order": 5, "content": "Gradually mix the dry ingredients into the butter mixture until just combined." },
    { "order": 6, "content": "Fold in chocolate chips with a spatula." },
    { "order": 7, "content": "Drop rounded tablespoons of dough onto prepared baking sheets, spacing 2 inches apart." },
    { "order": 8, "content": "Bake for 9-11 minutes or until edges are golden brown but centers still look slightly underdone." },
    { "order": 9, "content": "Cool on baking sheet for 2 minutes, then transfer to a wire rack to cool completely." }
  ]
}

Now extract the recipe and return it in a markdown JSON code block with no additional text.`

function RouteComponent() {
  const navigate = useNavigate()
  const { url } = Route.useSearch()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prompt = url ? craftPrompt(url) : null

  const handleCopy = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUrlChange = (newUrl: string) => {
    setError(null)
    navigate({
      to: '/recipes/steal',
      search: { url: newUrl || undefined },
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          Steal a Recipe
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Turn any recipe URL into your own shameless collection piece
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-6 rounded-lg border bg-card p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="url">Recipe URL</Label>
              {url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    navigate({
                      to: '/recipes/steal',
                      search: {},
                    })
                  }}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <X className="mr-1 size-3" />
                  Clear
                </Button>
              )}
            </div>
            <Input
              id="url"
              type="url"
              placeholder="Paste a recipe URL here..."
              className="text-base"
              onPaste={(e) => {
                e.preventDefault()
                const pastedText = e.clipboardData.getData('text')

                try {
                  const url = new URL(pastedText)
                  handleUrlChange(url.toString())
                } catch (err) {
                  setError(
                    'Invalid URL. Please paste a valid recipe URL (e.g., https://example.com/recipe)',
                  )
                }
              }}
              value={url || ''}
              readOnly
            />
            <p className="text-sm text-muted-foreground">
              Paste a link to any recipe online and the prompt will generate
              automatically
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Invalid URL</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {prompt && (
          <div className="space-y-6 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                AI Prompt
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>

            <div className="relative max-h-96 overflow-y-auto">
              <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
                <code className="text-foreground">{prompt}</code>
              </pre>
            </div>

            <p className="text-sm text-muted-foreground">
              Copy this prompt and paste it into your favorite AI (ChatGPT,
              Claude, Gemini, etc.) along with the recipe webpage content to
              extract the structured data.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
