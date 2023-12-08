import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import Module from "../../../sql/objects/module"
import SqlType from "../../../sql/sqlType"
import SqlFilter from "../../../sql/sqlFilter"
import connector from "../../../sql/connector"
import { Command } from "../../index"
import Activity from "../../../sql/objects/activity"
import assert from "assert"
import * as fs from "fs"
import Event from "../../../sql/objects/event"
import Location from "../../../sql/objects/location"
import LocationType from "../../../sql/objects/locationType"
import ModuleFlag from "../../../sql/objects/moduleFlag"
import Project from "../../../sql/objects/project"

export default {
  data: new SlashCommandBuilder()
    .setName('get')
    .setDescription('Get a database object')
    .addStringOption(opt => opt.setName('type').setDescription('The type to get').setRequired(true).addChoices(
      {name: 'Module', value: 'module'},
      {name: 'Activity', value: 'activity'},
      {name: 'Events', value: 'events'},
      {name: 'Locations', value: 'locations'},
      {name: 'Locations Type', value: 'locations_types'},
      {name: 'Module Flags', value: 'module_flags'},
      {name: 'Projects', value: 'projects'},
    ))
    .addStringOption(opt => opt.setName('filter').setDescription('The filter to filter on').setRequired(true))
    .addBooleanOption(opt => opt.setName('many').setDescription('Do you want many result ?').setRequired(false))
    .setDefaultMemberPermissions(0x0000000000000080),
  async execute(_client, interaction: ChatInputCommandInteraction) {
    const typeString = interaction.options.getString('type')
    const filter = JSON.parse(<string>interaction.options.getString('filter'))
    const many = interaction.options.getBoolean('many') ?? false
    await interaction.deferReply()
    let o: SqlType | SqlType[] | null = null
    switch (typeString) {
      case 'module':
        o = await (many ? connector.getMany(Module, SqlFilter.from(Module, filter)) : connector.getOne(Module, SqlFilter.from(Module, filter)))
        break
      case 'activity':
        o = await (many ? connector.getMany(Activity, SqlFilter.from(Activity, filter)) : connector.getOne(Activity, SqlFilter.from(Activity, filter)))
        break
      case 'events':
        o = await (many ? connector.getMany(Event, SqlFilter.from(Event, filter)) : connector.getOne(Event, SqlFilter.from(Event, filter)))
        break
      case 'locations':
        o = await (many ? connector.getMany(Location, SqlFilter.from(Location, filter)) : connector.getOne(Location, SqlFilter.from(Location, filter)))
        break
      case 'locations_types':
        o = await (many ? connector.getMany(LocationType, SqlFilter.from(LocationType, filter)) : connector.getOne(LocationType, SqlFilter.from(LocationType, filter)))
        break
      case 'module_flags':
        o = await (many ? connector.getMany(ModuleFlag, SqlFilter.from(ModuleFlag, filter)) : connector.getOne(ModuleFlag, SqlFilter.from(ModuleFlag, filter)))
        break
      case 'projects':
        o = await (many ? connector.getMany(Project, SqlFilter.from(Project, filter)) : connector.getOne(Project, SqlFilter.from(Project, filter)))
        break
      default:
        break
    }
    if (o === null) {
      await interaction.editReply('Object not found https://i.gifer.com/yH.gif')
    } else {
      if (many) {
        assert(Array.isArray(o))
        for (const os in o) {
          await o[os].recursiveMap()
        }
        const r = JSON.stringify(JSON.parse('[' + o.map(value => '\n' + value.toJson()) + '\n]'), null, 2)
        fs.writeFileSync('./' + typeString + 's.json', r)
        await interaction.editReply({content: 'Found:', files: ['./' + typeString + 's.json']})
      } else {
        assert(!Array.isArray(o))
        await o.recursiveMap()
        await interaction.editReply('Found: ```JSON\n' + o.toJson() + '\n```')
      }
    }
  }
} as Command
