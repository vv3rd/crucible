const { assign } = Object
const {} = Array

let mkCanvas = (root: HTMLElement) => {
	const color = `hsl(${Math.floor(Math.random() * 255)} 70% 70%)`
	let canvas = assign(document.createElement("canvas"), {
		style: "cursor:none;",
	})
	let ctx = canvas.getContext("2d")!
	let fill = () => {
		ctx.fillStyle = "black"
		ctx.fillRect(0, 0, canvas.width, canvas.height)
	}

	let resize = () => {
		canvas.width = root.offsetWidth
		canvas.height = root.offsetHeight
		fill()
	}

	let trace = (x: number, y: number) => {
		fill()
		ctx.fillStyle = "white"
		ctx.shadowColor = color
		ctx.shadowBlur = 20
		const r = 4
		for (let i = 0; i < 5; i++) {
			ctx.beginPath()
			ctx.arc(x - r, y - r, r * 2, 0, 2 * Math.PI)
			ctx.fill()
		}
	}

	canvas.addEventListener("mousemove", (event): void => {
		trace(event.offsetX, event.offsetY)
	})
	resize()
	window.addEventListener("resize", resize)

	return canvas
}

let root = document.getElementById("app")!

root.append(mkCanvas(root))
