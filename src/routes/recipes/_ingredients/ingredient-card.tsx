import { useState } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import type { Ingredient } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type IngredientCardProps = {
  ingredient: Ingredient
  onDelete: (id: number) => void
}

export function IngredientCard({ ingredient, onDelete }: IngredientCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <li className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      {isEditing ? (
        <div className="flex flex-1 items-center gap-3">
          <Input
            defaultValue={ingredient.name}
            placeholder="Ingredient name"
            className="flex-1"
          />
          <Input
            type="number"
            defaultValue={ingredient.amount}
            placeholder="Amount"
            step="0.01"
            className="w-24"
          />
          <Input
            defaultValue={ingredient.unit}
            placeholder="Unit"
            className="w-24"
          />
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              onClick={() => {
                // Save logic will go here
                setIsEditing(false)
              }}
            >
              <Check className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              onClick={() => setIsEditing(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <span className="text-foreground text-lg">
              {ingredient.amount && ingredient.unit && (
                <span className="font-semibold">
                  {ingredient.amount} {ingredient.unit}{' '}
                </span>
              )}
              {ingredient.name}
            </span>
          </div>
          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(ingredient.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      )}
    </li>
  )
}
