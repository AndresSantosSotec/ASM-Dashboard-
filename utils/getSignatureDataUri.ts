export function getSignatureDataUri(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas) return null
  return canvas.toDataURL("image/png")
}
