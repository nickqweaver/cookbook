import { useState } from 'react'
import { IngredientAddForm } from './ingredient-add-form'
import { IngredientCard } from './ingredient-card'
import { IngredientDelete } from './ingredient-delete'
import type { Ingredient } from '@/db/schema'

type IngredientsProps = {
  ingredients: Array<Ingredient>
  recipeId: number
}

export function Ingredients({ ingredients, recipeId }: IngredientsProps) {
  return (
    <section className="mb-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Ingredients</h2>
        <IngredientAddForm recipeId={recipeId} />
      </div>

      {ingredients.length > 0 ? (
        <ul className="space-y-3">
          {ingredients.map((ingredient) => (
            <IngredientCard key={ingredient.id} ingredient={ingredient} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-base">
          No ingredients added yet
        </p>
      )}
    </section>
  )
}
