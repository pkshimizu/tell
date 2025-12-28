import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@renderer/theme'
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
