interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  fullWidth?: boolean
  fullHeight?: boolean
  circle?: boolean
}

export default function MImage(props: Props) {
  return (
    <img
      {...props}
      style={{
        ...(props.width && { width: props.width }),
        ...(props.height && { height: props.height }),
        ...(props.fullWidth && { width: '100%' }),
        ...(props.fullHeight && { height: '100%' }),
        ...(props.circle && { borderRadius: '50%' }),
      }}
    />
  )
}
