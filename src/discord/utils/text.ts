import { createCanvas } from "canvas"

export const getTextWidthWithStyle = (text: string, style: string) => {
  const canvas = createCanvas(1100, 270)
  const ctx = canvas.getContext('2d')
  ctx.font = style
  return ctx.measureText(text).width
}
