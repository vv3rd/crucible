import { Telegraf } from "telegraf"
import { app_url, TOKEN } from "./settings"
import { voice_lines_fuse, voice_lines_array } from "./settings/voice-lines"
import { newInlineVoice } from "./utils/newInlineVoice"

const bot = new Telegraf(TOKEN!)

// bot.telegram.setWebhook(app_url + "/bot")

bot.command("all", ($) => {
	$.telegram.sendMessage($.chat.id, voice_lines_array.join("\n\n"))
})

bot.on("inline_query", ($) => {
	const matchingLines = voice_lines_fuse.search($.inlineQuery.query.trim())

	$.answerInlineQuery(
		matchingLines
			.map((res) => newInlineVoice(res.refIndex + 1, res.item))
			.slice(0, 5)
	)
})

bot.use(($) => {
	if ($.updateType === "inline_query" || $.updateType === "message") return

	if ($.message?.chat.id) {
		$.telegram.sendMessage($.message.chat.id, "Sorry, I only understend text")
	}
})

export default bot
