import Room, { Rooms } from "../../../sql/objects/room"
import { createCanvas, loadImage } from "canvas"
import connector from "../../../sql/connector"
import Activity from "../../../sql/objects/activity"
import Module from "../../../sql/objects/module"
import assert from "assert"
import { getTextWidthWithStyle } from "../../utils/text"
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { updateChannel } from "../../index"
import { promoMapping } from "../../utils/mappings"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
dayjs.extend(timezone)
dayjs.extend(utc)

export const sendRoomCreatedMessage = async (room: Room) => {
  const activity = await connector.getOne(Activity, {id: room.activityId})
  assert(activity)
  const module = await connector.getOne(Module, {id: activity.moduleId})
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

  const image = await createImage(room, activity, module)

  // There is small icons, so we don't want to compress the image too much to avoid artifacts and blurriness
  const attachment = new AttachmentBuilder(image.createPNGStream({
    compressionLevel: 0,
    resolution: 400,
  }), { name: 'room.png' })
  await updateChannel?.send({ files: [attachment] , components: [row, downloadRow], content: "<@&" + promoMapping[module.promo] + "> Activité planifié !" })
}

const roomImagesMapping: {[key in Rooms]: string} = {
  [Rooms.COMTE]: "COMTE.png",
  [Rooms.MORDOR]: "MORDOR.jpg",
  [Rooms.TORVALDS]: "TORVALDS.png",
  [Rooms.GALLIFREY]: "GALLIFREY.png",
  [Rooms.BOURG_PALETTE]: "BOURG_PALETTE.png",
  [Rooms.GOTHAM]: "GOTHAM.png",
  [Rooms.HUB_INNOVATION]: "HUB_INNOVATION.png",
  [Rooms.POUDLARD]: "POUDLARD.png",
  [Rooms.TATOOINE]: "TATOOINE.png",
  [Rooms.VOGONS]: "VOGONS.png",
  [Rooms.WESTEROS]: "WESTEROS.png",
  [Rooms.KAMAR_TAJ]: "KAMAR_TAJ.png",
  [Rooms.ACCUEIL]: "NA.png",
  [Rooms.BARNEY_STINSON]: "BARNEY_STINSON.png",
  [Rooms.CAFETERIA]: "CAFETERIA.png",
  [Rooms.FOYER]: "FOYER.png",
  [Rooms.HALL]: "HALL.png",
  [Rooms.MARTY_MCFLY]: "MARTY_MCFLY.png",
  [Rooms.NETHER]: "NETHER.png",
  [Rooms.PETIT_BUREAU_PEDAGOGIE]: "NA.png",
  [Rooms.VISIO_TEAMS]: "NA.png",
  [Rooms.ROOM_105]: "NA.png",
  [Rooms.ROOM_106]: "NA.png",
  [Rooms.ROOM_111]: "NA.png",
  [Rooms.ROOM_111_A]: "NA.png",
  [Rooms.ROOM_111_B]: "NA.png",
  [Rooms.ROOM_112]: "NA.png",
  [Rooms.ROOM_112_A]: "NA.png",
  [Rooms.ROOM_112_B]: "NA.png",
  [Rooms.ROOM_114]: "NA.png",
  [Rooms.ROOM_115]: "NA.png",
  [Rooms.AMPHI]: "NA.png",
  [Rooms.ROOM_20]: "NA.png",
  [Rooms.ROOM_L1_L8]: "NA.png",
  [Rooms.EXTERIEUR]: "NA.png",
  [Rooms.CITE_DES_CONGRES]: "NA.png",
  [Rooms.LA_CANTINE]: "NA.png",
  [Rooms.LE_PALACE]: "NA.png",
  [Rooms.VALEURIAD]: "NA.png"
}

const createImage = async (room: Room, activity: Activity, module: Module) => {
  const activityNameSize = 100 + getTextWidthWithStyle(activity.name, 'bold 20px sans-serif')
  const moduleNameSize = 100 + getTextWidthWithStyle(module.name, 'bold 24px sans-serif')
  const image = await loadImage("assets/rooms/" + roomImagesMapping[room.room])
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
  ctx.fillText(dayjs(room.start).utc().tz('Europe/Paris').format("HH[h]mm"), 20, 90)

  // Draw the activity end time
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(dayjs(room.end).utc().tz('Europe/Paris').format("HH[h]mm"), 20, 120)

  // Draw the room name in the bottom right corner
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(room.room, 20, canvas.height - 20)

  return canvas
}
