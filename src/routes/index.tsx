import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, ChefHat, Lock, Sparkles } from 'lucide-react'
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
              Mr. Weaver's
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Book of <span className="text-primary">Stolen Flavors</span>
            </h2>
          </div>

          <p className="text-muted-foreground text-xl md:text-2xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Where "inspired by" meets "I literally copied this from the internet
            and pretend it's mine at dinner parties"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild size="lg">
              <Link to="/recipes">
                <BookOpen className="mr-2 size-5" />
                Browse Stolen Goods
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/recipes/create">
                <Sparkles className="mr-2 size-5" />
                Steal a New Recipe
              </Link>
            </Button>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <Lock className="size-4" />
            <span>
              Hosted on Mr. Weaver's super secure home server (please don't hack
              me)
            </span>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="text-4xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">
              Original Recipes
            </div>
          </div>
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="text-4xl font-bold text-primary">∞</div>
            <div className="text-sm text-muted-foreground">
              Shamelessly Borrowed
            </div>
          </div>
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="text-4xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">
              Delicious Either Way
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-lg border bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground italic">
            "If you're good at something, never do it for free. But if you're
            bad at remembering recipes, definitely store them somewhere." - Mr.
            Weaver, probably
          </p>
        </div>
      </section>
    </div>
  )
}
