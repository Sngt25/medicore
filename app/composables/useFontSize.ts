export const useFontSize = () => {
  const fontSize = useCookie<number>('font-size', {
    default: () => 100
  })

  const options = [
    { label: 'Small', value: 87.5 },
    { label: 'Medium', value: 100 },
    { label: 'Large', value: 112.5 },
    { label: 'Extra Large', value: 125 }
  ]

  return {
    fontSize,
    options
  }
}
