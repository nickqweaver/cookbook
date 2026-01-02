import { Check } from 'lucide-react'
import type * as DbTypes from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CookStepOverviewProps {
  instructions: Array<DbTypes.Instruction & { checked: boolean }>
  currentStepIndex: number
  onStepSelect: (index: number) => void
}

export function CookStepOverview({
  instructions,
  currentStepIndex,
  onStepSelect,
}: CookStepOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {instructions.map((ins, index) => (
            <button
              key={ins.id}
              onClick={() => onStepSelect(index)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                index === currentStepIndex
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    ins.checked
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {ins.checked ? <Check className="size-3" /> : index + 1}
                </span>
                <p
                  className={`text-sm ${
                    ins.checked ? 'text-muted-foreground line-through' : ''
                  }`}
                >
                  {ins.content}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
