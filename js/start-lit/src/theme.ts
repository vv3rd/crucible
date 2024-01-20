import { unsafeCSS } from "lit"
import resetCss from "./reset.css?inline"

export const theme = {
	reset: unsafeCSS(resetCss),
}
