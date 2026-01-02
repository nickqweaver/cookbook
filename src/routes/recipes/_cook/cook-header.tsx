import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { Check, ChefHat, ChevronLeft, Loader2, Timer, X } from 'lucide-react'
import type * as DbTypes from '@/db/schema'
import { db } from '@/db'
import { cook } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useMutation } from '@/hooks/use-mutation'

// Server function to cancel the cook
export const cancelCook = createServerFn({ method: 'POST' })
  .inputValidator((data: { cookId: number }) => data)
  .handler(async ({ data }) => {
    try {
      await db
        .update(cook)
        .set({
          status: 'cancelled',
          endedAt: new Date(),
        })
        .where(eq(cook.id, data.cookId))

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to cancel cook',
      }
    }
  })

export type CookPhase = 'ingredients' | 'cooking' | 'completed'

export function formatElapsedTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface CookHeaderProps {
  recipeId: string
  recipeTitle: string
  cookId: number
  cookStatus: string
  cookCreatedAt: Date
  phase: CookPhase
  currentStepIndex: number
  instructions: Array<DbTypes.Instruction & { checked: boolean }>
  onStepSelect: (index: number) => void
  onCancelSuccess: () => void
}

export function CookHeader({
  recipeId,
  recipeTitle,
  cookId,
  cookStatus,
  cookCreatedAt,
  phase,
  currentStepIndex,
  instructions,
  onStepSelect,
  onCancelSuccess,
}: CookHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const { mutate: cancel, isPending: isCancelling } = useMutation(cancelCook)

  // Timer effect
  useEffect(() => {
    if (cookStatus !== 'in_progress') return

    const startTime = new Date(cookCreatedAt).getTime()
    const updateTimer = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [cookStatus, cookCreatedAt])

  const handleCancel = async () => {
    await cancel({ data: { cookId } }, { onSuccess: onCancelSuccess })
  }

  const completedSteps = instructions.filter((ins) => ins.checked).length
  const progressPercent = (completedSteps / instructions.length) * 100

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/recipes/$id"
          params={{ id: recipeId }}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Back to Recipe
        </Link>

        {cookStatus === 'in_progress' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <X className="size-4 mr-2" />
            )}
            Cancel Cook
          </Button>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <ChefHat className="size-8" />
            Cooking: {recipeTitle}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Timer className="size-4" />
              {formatElapsedTime(elapsedTime)}
            </span>
            {phase === 'cooking' && (
              <span>
                Step {currentStepIndex + 1} of {instructions.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {phase === 'cooking' && (
        <>
          <div className="mt-4">
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Step Navigation - Horizontal scrolling breadcrumbs */}
          <div className="overflow-x-auto mt-6">
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap">
                {instructions.map((ins, index) => (
                  <BreadcrumbItem key={ins.id} className="shrink-0">
                    <BreadcrumbLink
                      onClick={() => onStepSelect(index)}
                      className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                        index === currentStepIndex
                          ? 'bg-primary text-primary-foreground font-medium'
                          : ins.checked
                            ? 'bg-green-500/10 text-green-600'
                            : 'hover:bg-muted'
                      }`}
                    >
                      {ins.checked && index !== currentStepIndex ? (
                        <span className="flex items-center gap-1">
                          <Check className="size-3" />
                          Step {index + 1}
                        </span>
                      ) : (
                        `Step ${index + 1}`
                      )}
                    </BreadcrumbLink>
                    {index < instructions.length - 1 && <BreadcrumbSeparator />}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </>
      )}
    </div>
  )
}
