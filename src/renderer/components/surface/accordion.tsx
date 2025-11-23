import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export default function TAccordion(props: Props) {
  return (
    <Accordion>
      <AccordionSummary>
        <Typography>{props.title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{props.children}</AccordionDetails>
    </Accordion>
  )
}
