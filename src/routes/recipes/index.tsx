import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { ChefHat, Clock, Plus, Trash2, Users } from 'lucide-react'
import type { Recipe } from '@/db/schema'
import { recipe } from '@/db/schema'
import { db } from '@/db'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useMutation } from '@/hooks/use-mutation'

const RECIPES_PER_PAGE = 20

const getRecipes = createServerFn({ method: 'GET' })
  .inputValidator((data: { page: number }) => data)
  .handler(async ({ data }) => {
    try {
      const offset = (data.page - 1) * RECIPES_PER_PAGE

      const [recipes, totalResult] = await Promise.all([
        db
          .select()
          .from(recipe)
          .orderBy(desc(recipe.createdAt))
          .limit(RECIPES_PER_PAGE)
          .offset(offset),
        db.select({ count: recipe.id }).from(recipe),
      ])

      const total = totalResult.length

      return {
        success: true,
        data: {
          recipes,
          total,
          page: data.page,
          totalPages: Math.ceil(total / RECIPES_PER_PAGE),
        },
      }
    } catch (err) {
      console.error(err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to fetch recipes',
      }
    }
  })

const deleteRecipe = createServerFn({ method: 'POST' })
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(recipe).where(eq(recipe.id, data))

      return {
        success: true,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to delete recipe',
      }
    }
  })

type RecipesSearch = {
  page?: number
}

export const Route = createFileRoute('/recipes/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): RecipesSearch => {
    return {
      page: Number(search?.page) || 1,
    }
  },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ deps }) =>
    await getRecipes({ data: { page: deps.page || 1 } }),
})

type RecipeCardProps = {
  recipe: Recipe
}

type RecipeDeleteDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  recipeName: string
}

function RecipeDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  recipeName,
}: RecipeDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Recipe</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{recipeName}"? This action cannot
            be undone and will also delete all associated ingredients and
            instructions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecipeRow({ recipe }: RecipeCardProps) {
  const [deletingRecipeId, setDeletingRecipeId] = useState<number | null>(null)
  const { mutate: delRecipe } = useMutation(useServerFn(deleteRecipe))
  const router = useRouter()

  return (
    <>
      <div className="group flex items-center gap-6 rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:border-primary/50">
        <Link
          to="/recipes/$id"
          params={{ id: recipe.id.toString() }}
          className="flex-1 min-w-0 flex items-center gap-6"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors truncate">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-muted-foreground mt-1 text-sm line-clamp-1">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
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

          <div className="hidden md:block text-xs text-muted-foreground shrink-0 min-w-[100px] text-right">
            {new Date(recipe.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </Link>

        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-destructive hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDeletingRecipeId(recipe.id)
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <RecipeDeleteDialog
        isOpen={deletingRecipeId !== null}
        onClose={() => setDeletingRecipeId(null)}
        recipeName={recipe.title}
        onConfirm={() => {
          setDeletingRecipeId(null)
          delRecipe(
            { data: recipe.id },
            { onSuccess: () => router.invalidate() },
          )
        }}
      />
    </>
  )
}

function RouteComponent() {
  const data = Route.useLoaderData()
  const { page } = Route.useSearch()
  const router = useRouter()

  if (!data.success) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-destructive">{data.message}</div>
      </div>
    )
  }

  const { recipes, total, totalPages } = data.data
  const currentPage = page || 1

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
            Recipes
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Discover and explore your collection ({total} total)
          </p>
        </div>
        <Button asChild>
          <Link to="/recipes/create">
            <Plus className="mr-2 size-4" />
            Create Recipe
          </Link>
        </Button>
      </div>

      {recipes.length > 0 ? (
        <>
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <RecipeRow key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) {
                        router.navigate({
                          to: '/recipes',
                          search: { page: currentPage - 1 },
                        })
                      }
                    }}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => {
                    const showPage =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)

                    if (!showPage) {
                      if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            router.navigate({
                              to: '/recipes',
                              search: { page: pageNum },
                            })
                          }}
                          isActive={pageNum === currentPage}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  },
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) {
                        router.navigate({
                          to: '/recipes',
                          search: { page: currentPage + 1 },
                        })
                      }
                    }}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
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
