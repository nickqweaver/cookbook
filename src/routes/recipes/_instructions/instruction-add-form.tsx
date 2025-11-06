import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import type { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useMutation } from '@/hooks/use-mutation'

type InstructionAddFormProps = {
  recipeId: number
  addInstructionFn: ReturnType<typeof useServerFn>
  nextOrder: number
}

export function InstructionAddForm({
  recipeId,
  addInstructionFn,
  nextOrder,
}: InstructionAddFormProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  const mutation = useMutation(addInstructionFn)

  const defaultInstruction = {
    content: '',
    order: nextOrder,
  }

  const instructionForm = useForm({
    defaultValues: defaultInstruction,
    onSubmit: async ({ value }) => {
      const result = await mutation.mutate({
        data: { ...value, recipe: recipeId },
      })

      if (result?.success) {
        setShowForm(false)
        instructionForm.reset()
        router.invalidate()
      }
    },
  })

  return (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 size-4" />
          Add Instruction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Instruction</DialogTitle>
          <DialogDescription>
            Add a new step to your recipe instructions
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            instructionForm.handleSubmit()
          }}
          className="space-y-4"
        >
          <instructionForm.Field
            name="content"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Instruction</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Describe this step in detail..."
                  rows={4}
                />
              </div>
            )}
          />

          <instructionForm.Field
            name="order"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Step Number</Label>
                <Input
                  id={field.name}
                  type="number"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                  min={1}
                />
              </div>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding Instruction...' : 'Add Instruction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
