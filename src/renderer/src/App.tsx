import { Box, Container, Typography, Button, Stack } from '@mui/material'
import { Description, Send } from '@mui/icons-material'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Box
          component="img"
          src={electronLogo}
          alt="logo"
          sx={{
            width: 120,
            height: 120,
            mb: 2
          }}
        />
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Powered by electron-vite
        </Typography>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mt: 2 }}>
          Build an Electron app with{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>
            React
          </Box>{' '}
          and{' '}
          <Box component="span" sx={{ color: 'secondary.main' }}>
            TypeScript
          </Box>
        </Typography>
        <Typography variant="h6" component="h2" color="text.secondary" sx={{ mt: 1 }}>
          Noto Sans JPフォントで日本語表示
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Please try pressing <code>F12</code> to open the devTool
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<Description />}
            href="https://electron-vite.org/"
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </Button>
          <Button variant="outlined" startIcon={<Send />} onClick={ipcHandle}>
            Send IPC
          </Button>
        </Stack>
        <Box sx={{ mt: 4 }}>
          <Versions />
        </Box>
      </Box>
    </Container>
  )
}

export default App
