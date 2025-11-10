import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { desc } from 'drizzle-orm'
import { ChefHat, Clock, Plus, Users } from 'lucide-react'
import type { Recipe } from '@/db/schema'
import { recipe } from '@/db/schema'
import { db } from '@/db'
import { Button } from '@/components/ui/button'

const getRecipes = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const recipes = await db
      .select()
      .from(recipe)
      .orderBy(desc(recipe.createdAt))
      .limit(20)

    return {
      success: true,
      data: recipes,
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch recipes',
    }
  }
})

export const Route = createFileRoute('/recipes/')({
  component: RouteComponent,
  loader: async () => await getRecipes(),
})

type RecipeCardProps = {
  recipe: Recipe
}

function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to="/recipes/$id"
      params={{ id: recipe.id.toString() }}
      className="group block"
    >
      <div className="h-full rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
        <div className="mb-4">
          <h3 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="size-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ChefHat className="size-4" />
            <span>{recipe.preptime}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" />
            <span>{recipe.cooktime}m</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          {new Date(recipe.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
    </Link>
  )
}

function RouteComponent() {
  const data = Route.useLoaderData()

  if (!data.success) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-destructive">{data.message}</div>
      </div>
    )
  }

  const { data: recipes } = data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          Recipes
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Discover and explore your collection
        </p>
      </div>

      {recipes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-6">
            No recipes found. Create your first recipe to get started!
          </p>
          <Button asChild>
            <Link to="/recipes/create">
              <Plus className="mr-2 size-4" />
              Create Recipe
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
