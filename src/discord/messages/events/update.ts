import connector from "../../../sql/connector"
import Module from "../../../sql/objects/module"
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"
import { devChannel, updateChannel } from "../../index"
import assert from "assert"
import { promoMapping } from "../../utils/mappings"
import dayjs from "dayjs"
import Activity from "../../../sql/objects/activity"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { createEventImage } from "./new"
import { isDev } from "../../../index"
import Event from "../../../sql/objects/event"
import { SqlUpdate } from "../../../sql/types"
import SqlFilter from "../../../sql/sqlFilter"
dayjs.extend(timezone)
dayjs.extend(utc)

const formatUpdate = (field: keyof Event, oldValue: any, newValue: any) => {
  let emoji = ''
  let name = ''
  switch (field) {
    case "id":
      break
    case "end":
    case "start":
      emoji = '📆'
      break
    case "sessionIndex":
      emoji = '🔢'
      break
  }
  switch (field) {
    case "id":
      break
    case "start":
      name = "Date de début"
      break
    case "end":
      name = "Date de fin"
      break
    case "sessionIndex":
      name = "Index de session"
      break
  }
  let oldValueFormated = oldValue
  let newValueFormated = newValue
  if (oldValue instanceof Date && newValueFormated instanceof Date) {
    oldValueFormated = dayjs(oldValue).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '')
    newValueFormated = dayjs(newValue).locale('fr').format('ddd DD MMMM YYYY [à] HH:mm').replace('à 00:00', '')
  }
  return `* ${emoji} **${name}**:\n * Old: \`\`${oldValueFormated}\`\`\n * New: \`\`${newValueFormated}\`\``
}

export const sendEventUpdateMessage = async (update: SqlUpdate<any, Event>) => {
  assert(update)
  assert(update.isDiff)
  const activity = update.newObject.activity instanceof Activity ? update.newObject.activity : await connector.getOne(Activity, SqlFilter.from(Activity, { id: update.newObject.activity}))
  if (activity === null) return
  assert(typeof activity.module === 'number')
  const module = await connector.getOne(Module, SqlFilter.from(Module, { id: activity.module }))
  if (module === null) return
  const embed = new EmbedBuilder()
    .setTitle("Events update")
    .setColor("#3296d1")
    .setDescription("*An event just got updated!*")
    .setAuthor({
      name: "Oros",
      iconURL: "https://cdn.discordapp.com/attachments/1156230599619657758/1179455482772074656/image.png?ex=6579d884&is=65676384&hm=e13ec16751d23d910819da477798129806c5ee6d41f1406f9ce1a48fe4183a17"
    })
    .setURL("https://oros.dahobul.com/")
    .setTimestamp(new Date())
    .addFields([
      {
        name: "Activité",
        value: "``" + activity.name + "``",
        inline: true,
      },
      {
        name: "Début",
        value: "``" + update.newObject.startToString() + "``",
        inline: true,
      },
      {
        name: "Promo",
        value: "<@&" + promoMapping[module.promo] + ">",
        inline: true,
      }
    ])

  const updates = [] as string[]
  let updatesJoined = ''

  for (const key of <Array<keyof Event>>Object.keys(update.oldObject)) {
    // Check if the key is in the new object
    if (!(Object.keys(update.newObject).indexOf(key) > -1)) continue
    // Check if the key is the id or the start (they should not be updated)
    if (key === "id" || key === "start") continue

    const oldValue = update.oldObject[key]
    const newValue = update.newObject[key]

    let diff = oldValue !== newValue
    // If they are dates check millis
    if (oldValue instanceof Date && newValue instanceof Date) {
      diff = oldValue.getTime() !== newValue.getTime()
    }

    if (diff) {
      if (key === 'location') {
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

        const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
          components: [registerButton, seeActivityButton,]
        })

        const image = await createEventImage(update.newObject, activity, module)

        // There is small icons, so we don't want to compress the image too much to avoid artifacts and blurriness
        const attachment = new AttachmentBuilder(image.createPNGStream({
          compressionLevel: 0,
          resolution: 400,
        }), { name: 'event.png' })

        const channel = isDev ? devChannel : updateChannel
        await channel?.send({ files: [attachment] , components: [row], content: "<@&" + promoMapping[module.promo] + "> Changement de salle !" })

        return
      }
      updates.push(formatUpdate(key, oldValue, newValue))
    }
    updatesJoined = updates.join('\n')
  }

  embed.addFields([
    {
      name: "Updates",
      value: updatesJoined.length === 0 ? 'No updates' : updatesJoined
    }
  ])

  updateChannel?.send({ embeds: [embed] })
}
