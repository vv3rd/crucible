import { nanoid } from "nanoid"
import { audio_url } from "../settings"

export const newInlineVoice = (file_id: number, file_title: string) => ({
	type: "voice" as "voice",
	voice_url: `${audio_url}${file_id}`,
	id: nanoid(5),
	title: file_title[0].toUpperCase() + file_title.slice(1),
})
