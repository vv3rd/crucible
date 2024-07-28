require("dotenv").config()

export const app_url = process.env.APP_URL

export const TOKEN = process.env.BOT_TOKEN

if (!app_url) throw new Error("App url not found")
if (!TOKEN) throw new Error("Bot tokent not found")

export const PORT = process.env.PORT || 4040

export const audio_url = `${app_url}/api/voice/`
