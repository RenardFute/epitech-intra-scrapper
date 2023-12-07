import { createCanvas, loadImage } from "canvas"
import connector from "../../../sql/connector"
import Activity from "../../../sql/objects/activity"
import Module from "../../../sql/objects/module"
import assert from "assert"
import { getTextWidthWithStyle } from "../../utils/text"
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { devChannel, updateChannel } from "../../index"
import { promoMapping } from "../../utils/mappings"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { isDev } from "../../../index"
import Location from "../../../sql/objects/location"
import Event from "../../../sql/objects/event"
import SqlFilter from "../../../sql/sqlFilter"
dayjs.extend(timezone)
dayjs.extend(utc)

export const sendEventCreatedMessage = async (event: Event) => {
  const activity = event.activity instanceof Activity ? event.activity : await connector.getOne(Activity, SqlFilter.from(Activity, {id: event.activity}))
  assert(activity && typeof activity.module === 'number')
  const module = await connector.getOne(Module, SqlFilter.from(Module, {id: activity.module}))
  assert(module)

  const registerButton: ButtonBuilder = new ButtonBuilder()
    .setEmoji("🔗")
    .setLabel("See Module")
    .setStyle(ButtonStyle.Link)
    .setURL(module.url)

  const seeActivityButton: ButtonBuilder = new ButtonBuilder()
    .setEmoji("🔗")
    .setLabel("See Activity")
    .setStyle(ButtonStyle.Link)
    .setURL(activity.url)

  const iosButton: ButtonBuilder = new ButtonBuilder()
    .setEmoji("🍎")
    .setLabel("Oros iOS")
    .setStyle(ButtonStyle.Link)
    .setURL("https://apps.apple.com/fr/app/oros/id1661996262")
    .setDisabled(true)
  const androidButton: ButtonBuilder = new ButtonBuilder()
    .setEmoji("🤖")
    .setLabel("Oros Android")
    .setStyle(ButtonStyle.Link)
    .setURL("https://play.google.com/store/apps/details?id=com.oros.epitech&hl=en_US")
    .setDisabled(true)

  const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
    components: [registerButton, seeActivityButton,]
  })

  const downloadRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
    components: [iosButton, androidButton]
  })

  const image = await createEventImage(event, activity, module)

  // There is small icons, so we don't want to compress the image too much to avoid artifacts and blurriness
  const attachment = new AttachmentBuilder(image.createPNGStream({
    compressionLevel: 0,
    resolution: 400,
  }), { name: 'event.png' })

  const channel = isDev ? devChannel : updateChannel

  await channel?.send({ files: [attachment] , components: [row, downloadRow], content: "<@&" + promoMapping[module.promo] + "> Activité planifié !" })
}

export const createEventImage = async (event: Event, activity: Activity, module: Module) => {
  const activityNameSize = 100 + getTextWidthWithStyle(activity.name, 'bold 20px sans-serif')
  const moduleNameSize = 100 + getTextWidthWithStyle(module.name, 'bold 24px sans-serif')
  const location = event.location instanceof Location ? event.location : await connector.getOne(Location, SqlFilter.from(Location, {id: event.location}))
  assert(location)
  const image = await loadImage("assets/rooms/" + location.imagePath ?? 'NA.png')
  const imageRatio = image.height / image.width
  const finalWidth = Math.max(400, activityNameSize, moduleNameSize)
  const height = Math.max(finalWidth * imageRatio, 200)
  const imageSize = {w: height / imageRatio, h: height}
  const canvas = createCanvas(finalWidth, height)
  const ctx = canvas.getContext('2d')

  // Place the image on the right of the canvas

  ctx.drawImage(image, canvas.width - imageSize.w, 0, imageSize.w, imageSize.h)

  // Draw a black gradient from the left to the right going from full opacity to transparent
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
  // Since we want to be pitch black until the image starts
  const imageStart = canvas.width - imageSize.w
  gradient.addColorStop(Math.max((imageStart - 20) / canvas.width, 0.2), 'rgba(0, 0, 0, 1)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw the module name
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(module.name, 20, 30)

  // Draw the activity name
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(activity.name, 20, 60)

  // Draw the activity start time
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(event.startToString(), 20, 90)

  // Draw the activity end time
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(event.endToString(), 20, 120)

  if (event.sessionIndex !== 0) {
    // Draw the session index
    ctx.font = 'bold 20px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText("Session " + (event.sessionIndex + 1), 20, 150)
  }

  // Draw the room name in the bottom right corner
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(location.name, 20, canvas.height - 20)

  return canvas
}
