import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/recipes/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Render a recipe detail view and option to start cook</div>
}
