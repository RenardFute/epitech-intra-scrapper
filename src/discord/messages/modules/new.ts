import Module from "../../../sql/objects/module"
import { ButtonBuilder, EmbedBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } from "discord.js"
import { updateChannel } from "../../index"
import { promoMapping } from "../../utils/mappings"
import dayjs from "dayjs"
import * as fs from "fs"
import { getTextWidthWithStyle } from "../../utils/text"
import { createCanvas, loadImage } from "canvas"

export const sendModuleCreatedMessage = async (newModule: Module) => {
  const embed = new EmbedBuilder()
    .setTitle("Module Created")
    .setColor("#3296d1")
    .setDescription("*A module just got created!*")
    .setURL(newModule.url)
    .setAuthor({
      name: "Intra Epitech",
      iconURL: "https://images-ext-1.discordapp.net/external/qiLJZjR0HMNPppXcmysijgKR_kcAVkntHXsyjnFIryk/https/yt3.googleusercontent.com/8mA9eT4kl-CHHHQdCtNfMCWeL6RFFQElfY1ytMoNHF5BG1iMtHQ0b9YaonhC7bydvrG-9hkA%3Ds900-c-k-c0x00ffffff-no-rj"
    })
    .setTimestamp(new Date())
    .addFields([
      {
        name: "Name",
        value: "``" + newModule.name + "``",
        inline: true,
      },
      {
        name: "Code",
        value: "``" + newModule.code + "``",
        inline: true,
      },
      {
        name: "Promo",
        value: "<@&" + promoMapping[newModule.promo] + ">",
        inline: true,
      }
    ])

  if (newModule.credits > 0) {
    embed.addFields([{
      name: "Credits",
      value: "``" + newModule.credits + "``",
      inline: true,
    }])
  }

  embed.addFields([{
    name: "Start",
    value: "``" + dayjs(newModule.start).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '') + "``",
    inline: true,
  },
  {
    name: "End",
    value: "``" + dayjs(newModule.end).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '') + "``",
    inline: true,
  }])

  if (newModule.endRegistration) {
    embed.addFields([{
      name: "⚠️ End registration",
      value: "``" + dayjs(newModule.endRegistration).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '') + "``",
      inline: true,
    }])
  }

  embed.addFields([{
    name: "Flags",
    value: "- Is" + (newModule.isMandatory ? "" : " Not") + " Mandatory\n- Is" + (newModule.isRoadblock ? "" : " Not") + " Roadblock",
    inline: false,
  }])

  const registerButton: ButtonBuilder = new ButtonBuilder()
    .setEmoji("🔗")
    .setLabel("See Module")
    .setStyle(ButtonStyle.Link)
    .setURL(newModule.url)

  const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
    components: [registerButton],
  })

  //await updateChannel?.send({ embeds: [embed], components: [row] })
  const image = await createImage(newModule)

  // There is small icons, so we don't want to compress the image too much to avoid artifacts and blurriness
  const attachment = new AttachmentBuilder(image.createPNGStream({
    compressionLevel: 0,
    resolution: 400,
  }), { name: 'module.png' })
  await updateChannel?.send({ files: [attachment] , components: [row], content: "<@&" + promoMapping[newModule.promo] + "> Nouveau module !" })
}

const createImage = async (module: Module) => {
  const titleWidth = 200 + getTextWidthWithStyle(module.name, 'bold 48px sans-serif')
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

  // Draw the module name
  ctx.font = 'bold 48px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(module.name, 150, 80)

  // Draw the module code
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(module.code, 150, 120)

  // Draw the module city
  const pin = await loadImage(fs.readFileSync('assets/icons/pin.png'))
  ctx.drawImage(pin, 40, 160, 20, 20)
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(module.city, 70, 180)

  // Draw the module credits
  const credits = await loadImage(fs.readFileSync('assets/icons/credits.png'))
  ctx.drawImage(credits, 180, 160, 20, 20)
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(module.credits.toString() + " Crédit" + (module.credits > 1 ? 's' : ''), 210, 180)

  // Draw the module start date
  const date = await loadImage(fs.readFileSync('assets/icons/date.png'))
  ctx.drawImage(date, 40, 220, 20, 20)
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  const startText = dayjs(module.start).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '').replace(new Date().getFullYear().toString(), '')
  ctx.fillText(startText, 70, 240)

  // Draw the module end date
  ctx.drawImage(date, getTextWidthWithStyle(startText, 'bold 24px sans-serif') + 80, 220, 20, 20)
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  const endText = dayjs(module.end).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '').replace(new Date().getFullYear().toString(), '')
  ctx.fillText(endText, getTextWidthWithStyle(startText, 'bold 24px sans-serif') + 110, 240)

  // Draw a rounded rectangle to hold flags
  const flags = {size: {w: 32, h: 32}, margin: 10, count: 2}
  const rect = {w: flags.size.w*flags.count + flags.margin*(2 + flags.count - 1), h: flags.size.h + flags.margin*2}
  ctx.fillStyle = 'rgba(163,163,163,0.25)'
  ctx.beginPath()
  ctx.moveTo(canvas.width - 20 - rect.w, canvas.height - 20 - rect.h)
  ctx.lineTo(canvas.width - 20, canvas.height - 20 - rect.h)
  ctx.lineTo(canvas.width - 20, canvas.height - 20)
  ctx.lineTo(canvas.width - 20 - rect.w, canvas.height - 20)
  ctx.lineTo(canvas.width - 20 - rect.w, canvas.height - 20 - rect.h)
  ctx.closePath()
  ctx.fill()

  // Draw the flags (Grayed out if false)
  const mandatory = await loadImage(fs.readFileSync(module.isMandatory ? 'assets/icons/mandatory.png' : 'assets/icons/mandatory_gray.png'))
  const roadblock = await loadImage(fs.readFileSync(module.isRoadblock ? 'assets/icons/roadblock.png' : 'assets/icons/roadblock_gray.png'))
  ctx.drawImage(mandatory, canvas.width - 20 - rect.w + flags.margin, canvas.height - 20 - rect.h + flags.margin, flags.size.w, flags.size.h)
  ctx.drawImage(roadblock, canvas.width - 20 - rect.w + flags.margin*2 + flags.size.w, canvas.height - 20 - rect.h + flags.margin, flags.size.w, flags.size.h)

  return canvas
}
