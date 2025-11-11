import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  BookOpen,
  ChefHat,
  Home,
  Menu,
  Plus,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 transition-colors hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="size-7" />
            <span className="text-lg font-bold">Stolen Flavors</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col border-r bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 transition-colors hover:bg-accent"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            activeProps={{
              className:
                'mb-2 flex items-center gap-3 rounded-lg p-3 bg-primary text-primary-foreground hover:bg-primary/90',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/recipes"
            onClick={() => setIsOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            activeProps={{
              className:
                'mb-2 flex items-center gap-3 rounded-lg p-3 bg-primary text-primary-foreground hover:bg-primary/90',
            }}
          >
            <BookOpen size={20} />
            <span className="font-medium">Recipes</span>
          </Link>

          <Link
            to="/recipes/create"
            onClick={() => setIsOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            activeProps={{
              className:
                'mb-2 flex items-center gap-3 rounded-lg p-3 bg-primary text-primary-foreground hover:bg-primary/90',
            }}
          >
            <Plus size={20} />
            <span className="font-medium">Create Recipe</span>
          </Link>

          <div className="my-4 border-t" />

          <Link
            to="/recipes/steal"
            onClick={() => setIsOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            activeProps={{
              className:
                'mb-2 flex items-center gap-3 rounded-lg p-3 bg-primary text-primary-foreground hover:bg-primary/90',
            }}
          >
            <Sparkles size={20} />
            <span className="font-medium">Steal Recipe</span>
          </Link>

          <Link
            to="/recipes/digest"
            onClick={() => setIsOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            activeProps={{
              className:
                'mb-2 flex items-center gap-3 rounded-lg p-3 bg-primary text-primary-foreground hover:bg-primary/90',
            }}
          >
            <Utensils size={20} />
            <span className="font-medium">Digest Recipe</span>
          </Link>
        </nav>
      </aside>
    </>
  )
}
