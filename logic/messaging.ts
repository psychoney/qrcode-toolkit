export function sendParentEvent(event: string, data: any) {
  try {
    window.parent.postMessage(JSON.stringify({
      source: 'qrtoolkit-parent',
      event,
      data,
    }), '*')
  }
  catch (e) {
    console.error('[QR Toolkit] Failed to send message', e)
  }
}
