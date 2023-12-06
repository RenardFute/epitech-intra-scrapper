import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Command } from "../../index"
import { activitiesScrap, locationsScrap, modulesScrap, projectScrap, eventsScrap } from "../../../schedulers"
import { getSyncedPromos } from "../../../sql/objects/sourceUser"


export default {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Fetch updates from the intranet')
    .addStringOption(option => option.setName('type').setDescription('Type of objects to fetch').setRequired(false))
    .addBooleanOption(option => option.setName('all').setDescription('Fetch all data (even inactive)').setRequired(false))
    .setDefaultMemberPermissions(0x0000000000000080),
  async execute(_client, interaction) {
    const type = interaction.options.getString('type')
    const all = interaction.options.getBoolean('all') || false
    interaction.deferReply()
    if (!type) {
      const moduleStats = await modulesScrap()
      const activitiesStats = await activitiesScrap(all)
      const eventsStats = await eventsScrap(all)
      const projectStats = await projectScrap(all)

      const embed = new EmbedBuilder()
        .setTitle("Update Results")
        .setColor("#3296d1")
        .setDescription("*Here are the results of the update* [" + (await getSyncedPromos()).join(', ') + "]")
        .setFields([
          {
            name: "Modules",
            value: "``" + moduleStats.fetched + "`` fetched, ``" + moduleStats.inserted + "`` inserted, ``" + moduleStats.updated + "`` updated",
            inline: true,
          },
          {
            name: "Activities",
            value: "``" + activitiesStats.fetched + "`` fetched, ``" + activitiesStats.inserted + "`` inserted, ``" + activitiesStats.updated + "`` updated",
            inline: true,
          },
          {
            name: "Events",
            value: "``" + eventsStats.fetched + "`` fetched, ``" + eventsStats.inserted + "`` inserted, ``" + eventsStats.updated + "`` updated",
            inline: true,
          },
          {
            name: "Projects",
            value: "``" + projectStats.fetched + "`` fetched, ``" + projectStats.inserted + "`` inserted, ``" + projectStats.updated + "`` updated",
            inline: true,
          }]
        )
        .setFooter({text: "Done in " + (moduleStats.time + activitiesStats.time + eventsStats.time + projectStats.time) + "ms"})
      await interaction.editReply({embeds: [embed]})
      return
    }

    let stats = null
    let embed = null

    switch (type) {
      case 'modules':
        stats = await modulesScrap()
        embed = new EmbedBuilder()
          .setTitle("Update Results")
          .setColor("#3296d1")
          .setDescription("*Here are the results of the update*")
          .setFields([
            {
              name: "Modules",
              value: "``" + stats.fetched + "`` fetched, ``" + stats.inserted + "`` inserted, ``" + stats.updated + "`` updated",
              inline: true,
            }]
          )
          .setFooter({text: "Done in " + stats.time + "ms"})
        break
      case 'activities':
        stats = await activitiesScrap(all)
        embed = new EmbedBuilder()
          .setTitle("Update Results")
          .setColor("#3296d1")
          .setDescription("*Here are the results of the update*")
          .setFields([
            {
              name: "Activities",
              value: "``" + stats.fetched + "`` fetched, ``" + stats.inserted + "`` inserted, ``" + stats.updated + "`` updated",
              inline: true,
            }]
          )
          .setFooter({text: "Done in " + stats.time + "ms"})
        break
      case 'events':
        stats = await eventsScrap(all)
        embed = new EmbedBuilder()
          .setTitle("Update Results")
          .setColor("#3296d1")
          .setDescription("*Here are the results of the update*")
          .setFields([
            {
              name: "Events",
              value: "``" + stats.fetched + "`` fetched, ``" + stats.inserted + "`` inserted, ``" + stats.updated + "`` updated",
              inline: true,
            }]
          )
          .setFooter({text: "Done in " + stats.time + "ms"})
        break
      case 'projects':
        stats = await projectScrap(all)
        embed = new EmbedBuilder()
          .setTitle("Update Results")
          .setColor("#3296d1")
          .setDescription("*Here are the results of the update*")
          .setFields([
            {
              name: "Projects",
              value: "``" + stats.fetched + "`` fetched, ``" + stats.inserted + "`` inserted, ``" + stats.updated + "`` updated",
              inline: true,
            }]
          )
          .setFooter({text: "Done in " + stats.time + "ms"})
        break
      case 'locations':
        stats = await locationsScrap()
        embed = new EmbedBuilder()
          .setTitle("Update Results")
          .setColor("#3296d1")
          .setDescription("*Here are the results of the update*")
          .setFields([
            {
              name: "Locations",
              value: "``" + stats.locations.fetched + "`` fetched, ``" + stats.locations.inserted + "`` inserted, ``" + stats.locations.updated + "`` updated",
              inline: true,
            },
            {
              name: "Types",
              value: "``" + stats.types.fetched + "`` fetched, ``" + stats.types.inserted + "`` inserted, ``" + stats.types.updated + "`` updated",
              inline: true,
            }]
          )
          .setFooter({text: "Done in " + stats.locations.time + "ms"})
        break
      default:
        await interaction.editReply("Invalid type")
        break
    }
    if (embed)
      await interaction.editReply({embeds: [embed]})
  },
} as Command
