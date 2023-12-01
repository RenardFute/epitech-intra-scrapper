import MarkNotification from "../../../../sql/objects/notifications/markNotification"
import connector from "../../../../sql/connector"
import { updateChannel } from "../../../index"
import { getTextWidthWithStyle } from "../../../utils/text"
import { createCanvas, loadImage } from "canvas"
import fs from "fs"
import dayjs from "dayjs"
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import Activity from "../../../../sql/objects/activity"
import { isDev } from "../../../../index"

export default async function sendNewMarkNotification(mark: MarkNotification): Promise<any> {
  if (mark.notified)
    return
  const activity = await connector.getOne(Activity, {id: mark.jsonData.activityId})
  if (!activity) {
    throw new Error("Activity not found")
  }

  const image = await createImage(mark)

  const seeActivityButton = new ButtonBuilder()
    .setEmoji('🔗')
    .setURL(activity.url)
    .setLabel('Voir l\'activité')
    .setStyle(ButtonStyle.Link)

  const seeCommentButton = new ButtonBuilder()
    .setEmoji('💬')
    .setLabel('Voir le commentaire')
    .setStyle(ButtonStyle.Secondary)
    .setCustomId('see-comment[' + mark.id + ']')
    .setDisabled(mark.jsonData.comment.length === 0)

  const actionRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
    components: [seeActivityButton, seeCommentButton]
  })


  const attachment = new AttachmentBuilder(image.createPNGStream({
    compressionLevel: 0,
    resolution: 400,
  }), { name: 'module.png' })

  updateChannel?.guild.members.fetch(isDev ? "226501209148620802" : mark.userId).then((member) => {
    member.send({
      files: [attachment],
      components: [actionRow]
    }).then(() => {
      mark.notified = true
      connector.update(MarkNotification, mark, {id: mark.id})
      member.send({ content: "**🚧 DEV**\n```Json\n" + JSON.stringify(mark, null, 2) + "```" })
    })
  })
}


const createImage = async (mark: MarkNotification) => {
  const titleWidth = 200 + getTextWidthWithStyle(mark.message, 'bold 24px sans-serif')
  const canvas = createCanvas(Math.max(titleWidth, 750), 270)
  const ctx = canvas.getContext('2d')

  // Create a gradient from left to right
  // The gradient is pure blue under the intranet logo
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, '#2b93d0')
  gradient.addColorStop(0.5, '#3296d1')
  gradient.addColorStop(5, '#0068b5')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw the intranet logo
  const logo = await loadImage('https://images-ext-1.discordapp.net/external/qiLJZjR0HMNPppXcmysijgKR_kcAVkntHXsyjnFIryk/https/yt3.googleusercontent.com/8mA9eT4kl-CHHHQdCtNfMCWeL6RFFQElfY1ytMoNHF5BG1iMtHQ0b9YaonhC7bydvrG-9hkA%3Ds900-c-k-c0x00ffffff-no-rj')
  ctx.drawImage(logo, 20, 20, 100, 100)

  // Draw the notification title
  ctx.font = 'bold 48px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(mark.title, 150, 80)

  // Draw the notification message
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(mark.message, 150, 120)

  // Draw the mark icon
  const markIcon = await loadImage(fs.readFileSync('assets/icons/credits.png'))
  ctx.drawImage(markIcon, 150, 140, 20, 20)

  // Draw the mark
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(mark.jsonData.mark.toString(), 180, 160)

  // Draw the grader
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText("Noté par " + mark.jsonData.grader, 150, 200)

  // Draw the date
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  const date = dayjs(mark.createdAt).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '').replace(new Date().getFullYear().toString(), '')
  ctx.fillText(date, 150, 240)

  return canvas
}
