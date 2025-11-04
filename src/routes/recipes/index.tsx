import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/recipes/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>render a list of recipes</div>
}
