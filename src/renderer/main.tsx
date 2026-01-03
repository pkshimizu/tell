import React from 'react'
import ReactDOM from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@renderer/contexts/theme-context'
import { createRouter, RouterProvider, createHashHistory } from '@tanstack/react-router'
import { routeTree } from '@renderer/routeTree.gen'
import '@renderer/main.css'

// Create hash history for Electron app (works with file:// protocol)
const hashHistory = createHashHistory()

// Create a new router instance
const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultPreload: 'intent'
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
