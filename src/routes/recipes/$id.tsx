import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { recipe } from '@/db/schema'

const getRecipe = createServerFn({ method: 'GET' })
  .inputValidator((data: string) => {
    console.log(data, data)
    return parseInt(data)
  })
  .handler(async ({ data }) => {
    try {
      const [r] = await db.select().from(recipe).where(eq(recipe.id, data))
      return {
        success: true,
        data: r,
      }
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to retrieve recipe',
      }
    }
  })

export const Route = createFileRoute('/recipes/$id')({
  component: RouteComponent,
  loader: async (args) => await getRecipe({ data: args.params.id }),
})

function RouteComponent() {
  const data = Route.useLoaderData()

  if (!data.success) {
    return <div>Error Retrieving Recipe</div>
  }

  const r = data.data
  return (
    <div>
      <div>{r.title}</div>
    </div>
  )
}
