import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { AlertCircle, ArrowRight, Check, Copy, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StealSearch = {
  url?: string
}

const recipeSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  servings: z.number().default(1),
  preptime: z.number(),
  cooktime: z.number(),
  notes: z.string().nullable().optional(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      unit: z.string(),
    }),
  ),
  instructions: z.array(
    z.object({
      order: z.number(),
      content: z.string(),
    }),
  ),
})

const fetchRecipeHtml = createServerFn({ method: 'GET' })
  .inputValidator((url: string) => url)
  .handler(async ({ data: url }) => {
    try {
      const { NodeHtmlMarkdown } = await import('node-html-markdown')
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const html = await response.text()

      // Convert HTML to markdown
      const markdown = NodeHtmlMarkdown.translate(html, {
        ignore: ['script', 'style', 'iframe', 'noscript'],
      })

      return { success: true, content: markdown }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch recipe page',
      }
    }
  })

const extractRecipeWithAI = createServerFn({ method: 'POST' })
  .inputValidator((url: string) => url)
  .handler(async ({ data: url }) => {
    try {
      const { openai } = await import('@ai-sdk/openai')
      const { generateObject } = await import('ai')
      const { db } = await import('@/db')
      const { recipe, ingredient, instruction } = await import('@/db/schema')

      // Fetch and convert HTML to markdown
      const { NodeHtmlMarkdown } = await import('node-html-markdown')
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const html = await response.text()
      const markdown = NodeHtmlMarkdown.translate(html, {
        ignore: ['script', 'style', 'iframe', 'noscript'],
      })

      const aiStart = performance.now()
      // Extract recipe with AI
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: recipeSchema,
        prompt: `Extract the recipe information from the following webpage content. Return ONLY valid recipe data in JSON format.

Source URL: ${url}

Page Content:
${markdown}

Extract:
- title (string, required)
- description (string or null, optional)
- servings (number, default 1)
- preptime (number in minutes, required)
- cooktime (number in minutes, required)
- notes (string or null, optional)
- ingredients array with: name, amount (number), unit (string)
- instructions array with: order (number starting from 1), content (string)

If the page doesn't contain a valid recipe, return an error.`,
      })

      // Insert into database
      const [newRecipe] = await db
        .insert(recipe)
        .values({
          title: result.object.title,
          description: result.object.description || null,
          servings: result.object.servings || 1,
          preptime: result.object.preptime,
          cooktime: result.object.cooktime,
          notes: result.object.notes || null,
        })
        .returning()

      // Insert ingredients
      await db.insert(ingredient).values(
        result.object.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          recipe: newRecipe.id,
        })),
      )

      // Insert instructions
      await db.insert(instruction).values(
        result.object.instructions.map((inst) => ({
          order: inst.order,
          content: inst.content,
          recipe: newRecipe.id,
        })),
      )

      return { success: true, recipeId: newRecipe.id }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to extract recipe',
      }
    }
  })

export const Route = createFileRoute('/recipes/steal')({
  component: RouteComponent,
  ssr: false,
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
  content: string,
) => `You are an expert recipe extraction assistant. Your task is to analyze ONLY the content provided below and extract all relevant recipe information into a structured JSON format.

# Source URL:
${url}

# Page Content (Markdown):
\`\`\`markdown
${content}
\`\`\`

# CRITICAL INSTRUCTIONS:
- You must extract data **solely** from the markdown content provided above.
- **Never** invent, infer, fill in, or hallucinate details.
- If any critical information (title, ingredients, or instructions) is missing or incomplete,
  or if extraction confidence is uncertain, you must return a structured error
  **explaining the exact reason** for the failure.
- Use the provided JSON schema to shape your output.
- Every field in the recipe JSON must be explicitly supported by the content above.

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
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)

  const prompt = url && content ? craftPrompt(url, content) : null

  const fetchRecipe = useServerFn(fetchRecipeHtml)

  useEffect(() => {
    if (!url) {
      setContent(null)
      setLoading(false)
      return
    }

    ;(async () => {
      setLoading(true)
      setError(null)
      setContent(null)

      try {
        const result = await fetchRecipe({ data: url })

        if (result.success) {
          setContent(result.content)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? `Failed to fetch recipe page: ${err.message}`
            : 'Failed to fetch recipe page',
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [url])

  const handleCopy = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExtract = async () => {
    if (!url) return

    setExtracting(true)
    setError(null)

    try {
      const result = await extractRecipeWithAI({ data: url })

      if (result.success) {
        navigate({
          to: '/recipes/$id',
          params: { id: String(result.recipeId) },
        })
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to extract recipe: ${err.message}`
          : 'Failed to extract recipe',
      )
    } finally {
      setExtracting(false)
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
              Paste a link to any recipe online. We'll fetch the HTML and
              generate a prompt with the content included.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <Alert>
              <Loader2 className="size-4 animate-spin" />
              <AlertTitle>Fetching Recipe</AlertTitle>
              <AlertDescription>
                Loading recipe content from the URL...
              </AlertDescription>
            </Alert>
          )}

          {content && !loading && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleExtract}
                disabled={extracting}
                size="lg"
                className="w-full"
              >
                {extracting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Extracting Recipe with AI...
                  </>
                ) : (
                  'Extract Recipe with AI'
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Automatically extract and save the recipe using AI
              </p>
            </div>
          )}

          {extracting && (
            <Alert>
              <Loader2 className="size-4 animate-spin" />
              <AlertTitle>Extracting Recipe</AlertTitle>
              <AlertDescription>
                AI is analyzing the page and extracting recipe data...
              </AlertDescription>
            </Alert>
          )}
        </div>

        {prompt && !extracting && (
          <div className="space-y-6 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Manual Prompt (Optional)
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
              Or copy this prompt manually and paste it into your favorite AI
              (ChatGPT, Claude, Gemini, etc.) to extract the recipe yourself.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
