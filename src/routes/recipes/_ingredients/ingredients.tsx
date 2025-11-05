import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { IngredientAddForm } from './ingredient-add-form'
import { IngredientCard } from './ingredient-card'
import { IngredientDelete } from './ingredient-delete'
import type { Ingredient } from '@/db/schema'

type IngredientsProps = {
  ingredients: Array<Ingredient>
  recipeId: number
  addIngredientFn: Parameters<typeof useServerFn>[0]
}

export function Ingredients({
  ingredients,
  recipeId,
  addIngredientFn,
}: IngredientsProps) {
  const [deletingIngredientId, setDeletingIngredientId] = useState<
    number | null
  >(null)

  const addFn = useServerFn(addIngredientFn)

  return (
    <section className="mb-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Ingredients</h2>
        <IngredientAddForm recipeId={recipeId} addIngredientFn={addFn} />
      </div>

      {ingredients.length > 0 ? (
        <ul className="space-y-3">
          {ingredients.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onDelete={setDeletingIngredientId}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-base">
          No ingredients added yet
        </p>
      )}

      <IngredientDelete
        isOpen={deletingIngredientId !== null}
        onClose={() => setDeletingIngredientId(null)}
        onConfirm={() => {
          // Delete logic will go here
          console.log('Delete ingredient', deletingIngredientId)
          setDeletingIngredientId(null)
        }}
      />
    </section>
  )
}
