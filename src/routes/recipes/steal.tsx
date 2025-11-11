import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, Check, Copy, X } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StealSearch = {
  url?: string
}

export const Route = createFileRoute('/recipes/steal')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): StealSearch => {
    return {
      url: typeof search.url === 'string' ? search.url : undefined,
    }
  },
})

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
) => `You are an expert recipe extraction assistant. Your task is to analyze ONLY the content from the provided URL and extract all relevant recipe information into a structured JSON format.

# URL to Process:
${url}

# CRITICAL INSTRUCTIONS:
- You must extract data **solely** from the actual content of the specified webpage.
- **Never** invent, infer, fill in, or hallucinate details.
- If any critical information (title, ingredients, or instructions) is missing or incomplete,
  or if extraction confidence is uncertain, you must return a structured error
  **explaining the exact reason** for the failure.
- Use the provided JSON schema to shape your output.
- Every field in the recipe JSON must be explicitly supported by the webpage content.

# FAILURE CONDITIONS:
If ANY of the following occur, you must return an error object instead of a recipe:
1. The page does not contain a recognizable or complete recipe.
2. Any essential section (title, ingredients, instructions) is missing or incomplete.
3. There is uncertainty, ambiguity, or guesswork about any information.
4. The LLM detects conflicting or unreliable recipe data.

# ERROR RESPONSE FORMAT:
If extraction fails, output a **single JSON object** with the following fields:

\`\`\`json
{
  "error": true,
  "message": "Short human-readable summary of why recipe could not be extracted.",
  "details": {
    "missing_fields": ["title", "ingredients", ...],
    "partial_fields": ["description", "cooktime"],
    "reasoning": "A concise explanation of what was found and why it was considered unreliable or incomplete."
  }
}
\`\`\`

### Example error outputs:
**Missing recipe entirely:**
\`\`\`json
{
  "error": true,
  "message": "No recipe data detected on this page.",
  "details": {
    "missing_fields": ["title", "ingredients", "instructions"],
    "partial_fields": [],
    "reasoning": "The content appears to be a blog article without a recipe structure."
  }
}
\`\`\`

**Partial data found:**
\`\`\`json
{
  "error": true,
  "message": "Recipe data incomplete — missing ingredients list.",
  "details": {
    "missing_fields": ["ingredients"],
    "partial_fields": ["description"],
    "reasoning": "A recipe title and basic instructions were present, but no ingredient data was found in the page body."
  }
}
\`\`\`

# SUCCESS FORMAT:
If a complete and reliable recipe is found, return the extracted recipe as **a single JSON object**
wrapped in one markdown code block. You must strictly follow the schema below:

${JSON_SCHEMA}

# EXTRACTION GUIDELINES (apply ONLY when a valid recipe is confirmed):

## Recipe Basics:
- Extract exact title
- Include description only if present
- Extract servings, prep and cook time
- Extract notes, tips, or variations only if explicitly present

## Ingredients:
- Each must include numeric amount, standardized unit, descriptive name
- Convert fractions to decimals
- Remove prep terms from names (move to instructions if relevant)
- Do not invent ingredients

## Instructions:
- Number sequentially starting from 1
- Use only real cooking/prep steps from the page
- Clean formatting; preserve times, techniques, and temperatures

## Default Values (allowed only if recipe structure is otherwise complete):
- servings: 4
- preptime: 30
- cooktime: 30
- description: null
- notes: null

## Time Handling:
- Convert all time to minutes
- If range detected, pick midpoint or lower value
- Distinguish between prep and cook times if clearly stated

# CRITICAL OUTPUT REQUIREMENTS:
- Return exactly one markdown JSON block (no prose before or after)
- NEVER output multiple JSONs in one response
- NEVER add commentary outside the JSON
- If recipe is incomplete or uncertain, return detailed error JSON instead

# Example Recipe Output:
\`\`\`json
{
  "title": "Classic Chocolate Chip Cookies",
  "description": "Soft and chewy homemade chocolate chip cookies with crispy edges",
  "servings": 24,
  "preptime": 15,
  "cooktime": 12,
  "notes": "For chewier cookies, slightly underbake. Store airtight up to 5 days.",
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
    { "order": 1, "content": "Preheat oven to 375°F (190°C)." },
    { "order": 2, "content": "Cream butter and sugars until light and fluffy." },
    { "order": 3, "content": "Beat in eggs and vanilla." },
    { "order": 4, "content": "Mix in dry ingredients, then fold in chocolate chips." },
    { "order": 5, "content": "Scoop onto sheet and bake for 9–11 minutes." }
  ]
}
\`\`\`
`

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
            Steal a Recipe
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Turn any recipe URL into your own shameless collection piece
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/recipes/digest">
            Next: Digest
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
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
                  const u = new URL(pastedText)
                  handleUrlChange(u.toString())
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
