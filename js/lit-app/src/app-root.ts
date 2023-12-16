import { AppElement, customElement, html, property, css } from "./scaffolding"
import { theme } from "./theme"

const TAG = "app-root"

@customElement(TAG)
export default class MyElement extends AppElement {
	render() {
		return html`
			<slot></slot>
			<div>
				<button part="button" @click=${this._onClick}>
					count is ${this.count}
				</button>
			</div>
			<p class="read-the-docs">${this.docsHint}</p>
		`
	}

	@property()
	docsHint = "Click on the Vite and Lit logos to learn more"

	@property({ type: Number })
	count = 0

	private _onClick() {
		this.count++
	}

	static styles = [
		theme.reset,
		css`
			button {
				border: 5px solid black;
			}
		`,
	]
}

declare global {
	interface HTMLElementTagNameMap {
		[TAG]: MyElement
	}
}
