import { Box, Tab, Tabs, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type Tab = {
  value: string
  icon?: ReactNode
  label?: string
  panel?: ReactNode
}

interface Props {
  value: string
  tabs: Tab[]
  leftItem?: ReactNode
  rightItem?: ReactNode
  variant?: 'scrollable' | 'fullWidth'
  orientation?: 'horizontal' | 'vertical'
  onChange?: (_value: string) => void
}

export default function TTabView({
  value,
  tabs,
  leftItem,
  rightItem,
  variant = 'scrollable',
  orientation = 'horizontal',
  onChange
}: Props) {
  const selectedTab = tabs.find((tab) => tab.value === value)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'column' : 'row'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {leftItem}
          <Tabs
            value={value}
            onChange={(_, newValue) => onChange && onChange(newValue as string)}
            variant={variant}
            orientation={orientation}
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'start'
                    }}
                  >
                    {tab.icon && <Box sx={{ mr: 1 }}>{tab.icon}</Box>}
                    {tab.label && <Typography variant="button">{tab.label}</Typography>}
                  </Box>
                }
                value={tab.value}
                iconPosition="start"
                key={tab.value}
              />
            ))}
          </Tabs>
        </Box>
        {rightItem}
      </Box>
      <Box sx={{ m: 2 }}>{selectedTab && <Box>{selectedTab.panel}</Box>}</Box>
    </Box>
  )
}
