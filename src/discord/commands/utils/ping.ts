import { SlashCommandBuilder } from "discord.js"
import { Command } from "../../index"


export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(_client, interaction) {
    await interaction.reply('Pong!')
  },
} as Command
