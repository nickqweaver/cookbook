import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { CheckCircle2, ChevronLeft, Clock, Loader2, Timer } from 'lucide-react'
import { db } from '@/db'
import { cook } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMutation } from '@/hooks/use-mutation'
import { formatElapsedTime } from './cook-header'

// Server function to reopen a completed cook
export const reopenCook = createServerFn({ method: 'POST' })
  .inputValidator((data: { cookId: number }) => data)
  .handler(async ({ data }) => {
    try {
      await db
        .update(cook)
        .set({
          status: 'in_progress',
          endedAt: null,
        })
        .where(eq(cook.id, data.cookId))

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reopen cook',
      }
    }
  })

interface CookCompleteProps {
  recipeId: string
  recipeTitle: string
  cookId: number
  cookCreatedAt: Date
  cookEndedAt: Date | null
  onReopened: () => void
}

export function CookComplete({
  recipeId,
  recipeTitle,
  cookId,
  cookCreatedAt,
  cookEndedAt,
  onReopened,
}: CookCompleteProps) {
  const router = useRouter()
  const [elapsedTime, setElapsedTime] = useState(0)
  const { mutate: reopen, isPending: isReopening } = useMutation(reopenCook)

  // Calculate elapsed time
  useEffect(() => {
    const startTime = new Date(cookCreatedAt).getTime()
    const endTime = cookEndedAt ? new Date(cookEndedAt).getTime() : Date.now()
    setElapsedTime(Math.floor((endTime - startTime) / 1000))
  }, [cookCreatedAt, cookEndedAt])

  const handleReopen = async () => {
    await reopen(
      { data: { cookId } },
      {
        onSuccess: () => {
          router.invalidate()
          onReopened()
        },
      },
    )
  }

  return (
    <Card className="text-center">
      <CardContent className="pt-8 pb-8">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Cook Complete!</h2>
          <p className="text-muted-foreground">
            You finished cooking {recipeTitle}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <Clock className="size-4" />
            Started:{' '}
            {new Date(cookCreatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {cookEndedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-4" />
              Finished:{' '}
              {new Date(cookEndedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Timer className="size-4" />
            Duration: {formatElapsedTime(elapsedTime)}
          </span>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleReopen}
            disabled={isReopening}
          >
            {isReopening ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <ChevronLeft className="size-4 mr-2" />
            )}
            Continue Cooking
          </Button>
          <Button asChild size="lg">
            <Link to="/recipes/$id" params={{ id: recipeId }}>
              Back to Recipe
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
