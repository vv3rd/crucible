import { globalStyle, style } from '@vanilla-extract/css'

globalStyle(":root", {
  fontFamily: "Inter, Avenir, Helvetica, Arial, sans-serif",  
  fontSize: 16,
  lineHeight: '24px',
  fontWeight: 400,

  fontSynthesis: "none",
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: "grayscale",
  WebkitTextSizeAdjust: "100%"
})

export const container = style(["container", {
	paddingBlock: "1rem",
}])

export const row = style({
	display: "flex",
	columnGap: "0.5ch"
})

