import { useState } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import type { Instruction } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type InstructionCardProps = {
  instruction: Instruction
  stepNumber: number
  onDelete: (id: number) => void
}

export function InstructionCard({
  instruction,
  stepNumber,
  onDelete,
}: InstructionCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <li className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      {isEditing ? (
        <div className="flex flex-1 gap-3">
          <Input
            type="number"
            defaultValue={instruction.order}
            className="w-16 text-center"
            min={1}
          />
          <div className="flex flex-1 flex-col gap-3">
            <Textarea
              defaultValue={instruction.content}
              placeholder="Instruction content"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  // Save logic will go here
                  setIsEditing(false)
                }}
              >
                <Check className="mr-2 size-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                <X className="mr-2 size-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold">
            {stepNumber}
          </span>
          <p className="text-foreground flex-1 pt-1 text-lg leading-relaxed">
            {instruction.content}
          </p>
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
              onClick={() => onDelete(instruction.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      )}
    </li>
  )
}
