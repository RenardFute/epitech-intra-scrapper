import {
  SlashCommandBuilder,
  ActionRowBuilder, StringSelectMenuBuilder
} from "discord.js"
import { Command } from "../../index"
import { Promo } from "../../../sql/objects/sourceUser"


export default {
  data: new SlashCommandBuilder()
    .setName('add-cookie')
    .setDescription('Give a cookie to the db'),
  async execute(_client, interaction) {

    const promoSelect: StringSelectMenuBuilder = new StringSelectMenuBuilder()
      .setCustomId("promoSelect")
      .setPlaceholder("Sélectionnez votre promo")
      .addOptions((Object.keys(Promo) as Array<keyof typeof Promo>).map((key) => {
        return {
          label: Promo[key],
          value: key
        }
      }))
      .setMaxValues(1)
      .setMinValues(1)

    const row: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder({
      components: [promoSelect]
    })

    interaction.reply({
      content: '🎓 Veuillez choisir votre promo',
      components: [row],
      ephemeral: true
    })
  },
} as Command
