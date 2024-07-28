import fs from "fs"
import Fuse from "fuse.js"
import path from "path"
import YAML from "yaml"

const voice_lines_file_path = path.join(__dirname, "voices.yml")

const voice_lines_file = fs.readFileSync(voice_lines_file_path, {
	encoding: "utf8",
})

export const voice_lines_array: string[] = YAML.parse(voice_lines_file)

if (!Array.isArray(voice_lines_array)) {
	throw new TypeError("Voice lines file was parsed incorectly")
}

export const voice_lines_fuse = new Fuse(voice_lines_array, {
	threshold: 0.5,
})
