export const view = ref<'generator' | 'processor' | 'compare' | 'credit' | 'verify' | 'camera'>(location.hash.slice(1) as any || 'generator')

// @ts-expect-error back
if (view.value === 'scan')
  view.value = 'verify'

if (!['generator', 'processor', 'compare', 'credit', 'verify', 'camera'].includes(view.value))
  view.value = 'generator'

watchEffect(() => {
  location.hash = view.value
})
