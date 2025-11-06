import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { InstructionAddForm } from './instruction-add-form'
import { InstructionCard } from './instruction-card'
import { InstructionDelete } from './instruction-delete'
import type { Instruction } from '@/db/schema'

type InstructionsProps = {
  instructions: Array<Instruction>
  recipeId: number
  addInstructionFn: Parameters<typeof useServerFn>[0]
}

export function Instructions({
  instructions,
  recipeId,
  addInstructionFn,
}: InstructionsProps) {
  const [deletingInstructionId, setDeletingInstructionId] = useState<
    number | null
  >(null)

  const addFn = useServerFn(addInstructionFn)

  const sortedInstructions = [...instructions].sort((a, b) => a.order - b.order)
  const nextOrder =
    sortedInstructions.length > 0
      ? sortedInstructions[sortedInstructions.length - 1].order + 1
      : 1

  return (
    <section className="mb-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Instructions</h2>
        <InstructionAddForm
          recipeId={recipeId}
          addInstructionFn={addFn}
          nextOrder={nextOrder}
        />
      </div>

      {sortedInstructions.length > 0 ? (
        <ol className="space-y-4">
          {sortedInstructions.map((instructionItem, index) => (
            <InstructionCard
              key={instructionItem.id}
              instruction={instructionItem}
              stepNumber={index + 1}
              onDelete={setDeletingInstructionId}
            />
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-base">
          No instructions added yet
        </p>
      )}

      <InstructionDelete
        isOpen={deletingInstructionId !== null}
        onClose={() => setDeletingInstructionId(null)}
        onConfirm={() => {
          // Delete logic will go here
          console.log('Delete instruction', deletingInstructionId)
          setDeletingInstructionId(null)
        }}
      />
    </section>
  )
}
