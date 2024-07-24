import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/me')({
  component: () => <div>Hello /_main/me!</div>
})
