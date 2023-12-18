import express from "express"
import bot from "./bot"
import fs from "fs/promises"
import path from "path"
import { app_url, PORT } from "./settings"

const audio_root = path.join(__dirname, "audio")

const app = express()
const api = express()

app
	.use(express.json(), express.urlencoded({ extended: true })) //applies json parsing middleware
	.use(bot.webhookCallback("/bot"))
	.use("/api", api)
	.post("/", (req) => {
		console.log("[My Log] incoming post request url", req.url)
		console.log("[My Log] incoming post request body", req.body)
	})

api.get("/voice/:id", (req, res) => {
	const id = req.params.id

	fs.readdir(audio_root).then((files) => {
		const file_name = files.find((file) => file.startsWith(id))

		if (file_name) {
			res.sendFile(file_name, {
				root: audio_root,
			})
		} else {
			res
				.status(404)
				.json({ error: { message: `File with id ${id} not found` } })
		}
	})
})

app.listen(PORT, () => {
	console.log("Running on port", PORT)
	console.log("App url", app_url)
})
