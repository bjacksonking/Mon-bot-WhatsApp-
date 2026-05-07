import fs from "fs"
import stylizedChar from "./fancy.js"

export default function stylizedCardMessage(text) {
  return {
    text: stylizedChar(text),
    contextInfo: {
      externalAdReply: {
        title: "𝘅𝙆𝙄𝙉𝙂~𝘿𝙅𝙀𝙁𝙁𝘅",
        body: "𝘅𝙆𝙄𝙉𝙂~𝘿𝙅𝙀𝙁𝙁𝘅 bot",
        thumbnail: fs.readFileSync("./database/DigiX.jpg"),
        sourceUrl: "https://whatsapp.com",
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  }
}