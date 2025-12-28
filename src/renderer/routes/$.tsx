import { createFileRoute, Navigate } from '@tanstack/react-router'

// Catch-all route for 404 pages - redirects to home
export const Route = createFileRoute('/$')({
  component: () => <Navigate to="/" replace />
})
