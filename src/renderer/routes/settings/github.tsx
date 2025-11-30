import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/github')({
  component: RouteComponent
})

function RouteComponent() {
  return <div>/settings/github</div>
}
