import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel
} from "discord.js"
import 'dotenv/config'
import path from "path"
import * as fs from "fs"

type CustomClient = Client & { commands: Collection<string, any> }
export type Command = { data: SlashCommandBuilder, execute: (client: Client, interaction: any) => Promise<void> }

// Create a new client instance
const client: CustomClient = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMembers] }) as CustomClient
client.commands = new Collection()
const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

const registerCommands = (async () => {
  const commands = []

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'))
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file)
      const mod = await import(filePath)
      const command: Command = mod.default as Command
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
        commands.push(command.data.toJSON())
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
      }
    }
  }


  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`)
    const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? '')

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID ?? '', process.env.DISCORD_GUILD_ID ?? ''),
      { body: commands},
    ) as any[]

    console.log(`Successfully reloaded ${data.length} application (/) commands.`)
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error)
  }
})

registerCommands()

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user?.tag}!`)
  updateChannel = c.channels.cache.get(process.env.DISCORD_UPDATE_CHANNEL_ID ?? '') as TextChannel
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return

  const command = (<CustomClient>interaction.client).commands.get(interaction.commandName) as Command

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction.client, interaction)
  } catch (error) {
    console.error(error)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
    }
  }
})

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN)

export let updateChannel: TextChannel | undefined = undefined

export default client
