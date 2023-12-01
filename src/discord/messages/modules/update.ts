import { SqlUpdate } from "../../../sql/connector"
import Module from "../../../sql/objects/module"
import { EmbedBuilder } from "discord.js"
import { devChannel, updateChannel } from "../../index"
import assert from "assert"
import { promoMapping } from "../../utils/mappings"
import dayjs from "dayjs"
import { isDev } from "../../../index"

const formatUpdate = (field: keyof Module, oldValue: any, newValue: any) => {
  let emoji = ''
  let name = ''
  switch (field) {
    case "id":
    case "promo":
      break
    case "name":
    case "nameFull":
    case "code":
      emoji = '🏷️'
      break
    case "semester":
    case "year":
    case "end":
    case "start":
    case "endRegistration":
      emoji = '📆'
      break
    case "city":
      emoji = '🏘️'
      break
    case "credits":
      emoji = '📚'
      break
    case "isOngoing":
      emoji = '🏃‍♂️'
      break
    case "isRegistrationOpen":
      emoji = '📝'
      break
    case "isRoadblock":
      emoji = '🚧'
      break
    case "isMandatory":
      emoji = '🚩'
      break
    case "url":
      emoji = '🔗'
      break
  }
  switch (field) {
    case "id":
    case "promo":
      break
    case "name":
      name = "Name"
      break
    case "nameFull":
      name = "Full name"
      break
    case "code":
      name = "Code"
      break
    case "semester":
      name = "Semester"
      break
    case "year":
      name = "Year"
      break
    case "start":
      name = "Start date"
      break
    case "end":
      name = "End date"
      break
    case "endRegistration":
      name = "End registration date"
      break
    case "city":
      name = "City"
      break
    case "credits":
      name = "Credits"
      break
    case "isOngoing":
      name = "Is ongoing"
      break
    case "isRegistrationOpen":
      name = "Is registration open"
      break
    case "isRoadblock":
      name = "Is roadblock"
      break
    case "isMandatory":
      name = "Is mandatory"
      break
    case "url":
      name = "URL"
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

export const sendModuleUpdateMessage = async (update: SqlUpdate<any, Module>) => {
  assert(update)
  assert(update.isDiff)
  const embed = new EmbedBuilder()
    .setTitle("Module update")
    .setColor("#3296d1")
    .setDescription("*A module just got updated!*")
    .setURL(update.newObject.url)
    .setAuthor({
      name: "Intra Epitech",
      iconURL: "https://images-ext-1.discordapp.net/external/qiLJZjR0HMNPppXcmysijgKR_kcAVkntHXsyjnFIryk/https/yt3.googleusercontent.com/8mA9eT4kl-CHHHQdCtNfMCWeL6RFFQElfY1ytMoNHF5BG1iMtHQ0b9YaonhC7bydvrG-9hkA%3Ds900-c-k-c0x00ffffff-no-rj"
    })
    .setTimestamp(new Date())
    .addFields([
      {
        name: "Name",
        value: "``" + update.newObject.name + "``",
        inline: true,
      },
      {
        name: "Code",
        value: "``" + update.newObject.code + "``",
        inline: true,
      },
      {
        name: "Promo",
        value: "<@&" + promoMapping[update.newObject.promo] + ">",
        inline: true,
      }
    ])

  const updates = [] as string[]
  let updatesJoined = ''

  for (const key of Object.keys(update.oldObject)) {
    // Check if the key is in the new object
    if (!(Object.keys(update.newObject).indexOf(key) > -1)) continue
    // Check if the key is the id or the promo (they should not be updated)
    if (key === "id" || key === "promo") continue

    const oldValue = update.oldObject[<keyof Module>key]
    const newValue = update.newObject[<keyof Module>key]

    let diff = oldValue !== newValue
    // If they are dates check millis
    if (oldValue instanceof Date && newValue instanceof Date) {
      diff = oldValue.getTime() !== newValue.getTime()
    }

    if (diff) {
      updates.push(formatUpdate(<keyof Module>key, oldValue, newValue))
    }
    updatesJoined = updates.join('\n')
  }

  embed.addFields([
    {
      name: "Updates",
      value: updatesJoined.length === 0 ? 'No updates' : updatesJoined
    }
  ])

  const channel = isDev ? devChannel : updateChannel
  if (isDev)
    devChannel?.send({ content: '**🚧 DEV**\n```Json\n' + JSON.stringify(update, null, 2) + '```' })
  channel?.send({ embeds: [embed] })
}
