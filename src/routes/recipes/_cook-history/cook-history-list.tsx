import { Link } from '@tanstack/react-router'
import { CheckCircle2, History, Timer, XCircle } from 'lucide-react'
import type { Cook } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type CookHistoryProps = {
  cooks: Array<Cook>
  recipeId: number
}

export function CookHistoryList({ cooks, recipeId }: CookHistoryProps) {
  if (cooks.length === 0) {
    return null
  }

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'In progress'
    const diffMs = new Date(end).getTime() - new Date(start).getTime()
    const mins = Math.floor(diffMs / 60000)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`
    }
    return `${mins}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="size-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="size-4 text-red-500" />
      default:
        return <Timer className="size-4 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'In Progress'
    }
  }

  return (
    <section className="mb-12 space-y-6">
      <div className="flex items-center gap-2">
        <History className="size-6" />
        <h2 className="text-3xl font-semibold tracking-tight">Cook History</h2>
      </div>

      <div className="space-y-3">
        {cooks.map((cookItem) => (
          <Card key={cookItem.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(cookItem.status)}
                    <span className="font-medium">
                      {getStatusLabel(cookItem.status)}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(cookItem.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(cookItem.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Duration:{' '}
                    {formatDuration(cookItem.createdAt, cookItem.endedAt)}
                  </span>
                  {cookItem.status === 'in_progress' && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/recipes/$id/cook/$cookId"
                        params={{
                          id: String(recipeId),
                          cookId: String(cookItem.id),
                        }}
                      >
                        Resume
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
