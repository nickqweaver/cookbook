import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { InstructionDelete } from './instruction-delete'
import type { Instruction, InstructionInput } from '@/db/schema'
import { instruction } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMutation } from '@/hooks/use-mutation'
import { db } from '@/db'

type InstructionCardProps = {
  instruction: Instruction
  stepNumber: number
}

const deleteInstruction = createServerFn({ method: 'POST' })
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(instruction).where(eq(instruction.id, data))

      return {
        success: true,
      }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to delete instruction',
      }
    }
  })

const editInstruction = createServerFn({ method: 'POST' })
  .inputValidator((data: Partial<InstructionInput> & { id: number }) => data)
  .handler(async ({ data }) => {
    try {
      await db.update(instruction).set(data).where(eq(instruction.id, data.id))

      return {
        success: true,
        updatedFields: Object.keys(data),
      }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to update instruction',
      }
    }
  })

export function InstructionCard({
  instruction,
  stepNumber,
}: InstructionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [deletingInstructionId, setDeletingInstructionId] = useState<
    number | null
  >(null)
  const { mutate: edit, isPending } = useMutation(editInstruction)
  const { mutate: delInstruction } = useMutation(useServerFn(deleteInstruction))
  const router = useRouter()

  const defaultInstruction: Partial<InstructionInput> = {
    content: instruction.content,
    order: instruction.order,
  }

  const instructionForm = useForm({
    defaultValues: defaultInstruction,
    onSubmit: async ({ value }) => {
      await edit(
        { data: { ...value, id: instruction.id } },
        { onSuccess: () => router.invalidate() },
      )
      setIsEditing(false)
    },
  })

  const handleCancel = () => {
    instructionForm.reset()
    setIsEditing(false)
  }

  return (
    <li className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      {isEditing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            instructionForm.handleSubmit()
          }}
          className="flex flex-1 gap-3"
        >
          <instructionForm.Field
            name="order"
            children={(field) => (
              <Input
                type="number"
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                className="w-16 text-center"
                min={1}
              />
            )}
          />
          <div className="flex flex-1 flex-col gap-3">
            <instructionForm.Field
              name="content"
              children={(field) => (
                <Textarea
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Instruction content"
                  rows={3}
                />
              )}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={isPending}
              >
                <Check className="mr-2 size-4" />
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancel}
              >
                <X className="mr-2 size-4" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
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
              onClick={() => setDeletingInstructionId(instruction.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      )}
      <InstructionDelete
        isOpen={deletingInstructionId !== null}
        onClose={() => setDeletingInstructionId(null)}
        onConfirm={() => {
          setDeletingInstructionId(null)
          delInstruction(
            { data: deletingInstructionId as number },
            { onSuccess: () => router.invalidate() },
          )
        }}
      />
    </li>
  )
}
