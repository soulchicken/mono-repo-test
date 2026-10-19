export function button(label, variant = 'primary') {
  return { type: 'button', label, variant: variant === '' ? 'primary' : (variant ?? 'primary') }
}
