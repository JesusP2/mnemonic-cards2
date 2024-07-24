import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Landing,
})

function Landing() {
  return <div>lading page</div>
}
