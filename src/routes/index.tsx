import { Link, createFileRoute } from '@tanstack/react-router'
import {
  BookOpen,
  ChefHat,
  Clock,
  Download,
  ListChecks,
  Utensils,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="relative max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <ChefHat className="size-16 md:size-20" />
              <BookOpen className="size-16 md:size-20 text-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
              Cook<span className="text-primary">Weave</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Your personal recipe collection, beautifully organized
            </p>
          </div>

          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Import recipes from any website, organize your collection, and cook
            with confidence using step-by-step guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild size="lg">
              <Link to="/recipes">
                <BookOpen className="mr-2 size-5" />
                Browse Recipes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/recipes/import">
                <Download className="mr-2 size-5" />
                Import a Recipe
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything you need to manage your recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 p-6 rounded-lg border bg-card text-center">
            <div className="flex justify-center mb-4">
              <Download className="size-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Smart Import</h3>
            <p className="text-sm text-muted-foreground">
              Paste any recipe URL and let AI extract ingredients, instructions,
              and timing automatically.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-lg border bg-card text-center">
            <div className="flex justify-center mb-4">
              <ListChecks className="size-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Guided Cooking</h3>
            <p className="text-sm text-muted-foreground">
              Follow along step-by-step with ingredient checklists and clear
              instructions as you cook.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-lg border bg-card text-center">
            <div className="flex justify-center mb-4">
              <Utensils className="size-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Cook History</h3>
            <p className="text-sm text-muted-foreground">
              Track when you last made each recipe and keep notes on your
              personal tweaks.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="flex justify-center mb-2">
              <Clock className="size-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              Save time with instant recipe imports
            </div>
          </div>
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="flex justify-center mb-2">
              <BookOpen className="size-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              All your recipes in one place
            </div>
          </div>
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="flex justify-center mb-2">
              <ChefHat className="size-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              Cook with confidence, every time
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
