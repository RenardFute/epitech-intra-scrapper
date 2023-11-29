import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js"
import { Command } from "../../index"
import SourceUser, { isUserStillLoggedIn } from "../../../sql/objects/sourceUser"
import connector from "../../../sql/connector"


export default {
  data: new SlashCommandBuilder()
    .setName('check-cookies')
    .setDescription('Give a cookie to the db')
    .setDefaultMemberPermissions(0x0000000000000080),
  async execute(_client, interaction) {
    const sourceUsers = await connector.getMany(SourceUser)
    await interaction.deferReply()
    const validUsers = []
    const invalidUsers = []
    for (const user of sourceUsers) {
      if (!await isUserStillLoggedIn(user)) {
        invalidUsers.push(user)
      } else {
        validUsers.push(user)
      }
      await new Promise(resolve => setTimeout(resolve, 250))
    }

    const validUsersEmbed = new EmbedBuilder()
      .setTitle("Cookies valides")
      .setDescription(validUsers.map((user) => `${user} - ${user.promo}`).join("\n") || "Aucun cookie valide")
      .setColor("#00ff00")

    const invalidUsersEmbed = new EmbedBuilder()
      .setTitle("Cookies invalides")
      .setDescription(invalidUsers.map((user) => `${user} - ${user.promo}`).join("\n") || "Aucun cookie invalide")
      .setColor("#ff0000")

    interaction.editReply({
      embeds: [validUsersEmbed, invalidUsersEmbed]
    })
  },
} as Command
