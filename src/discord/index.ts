import {ActivityOptions, Client, Collection, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder, TextChannel, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder} from "discord.js"
import 'dotenv/config'
import path from "path"
import * as fs from "fs"
import SourceUser, { Promo } from "../sql/objects/sourceUser"
import connector from "../sql/connector"

type CustomClient = Client & { commands: Collection<string, Command> }
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

registerCommands().then()

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user?.tag}!`)
  updateChannel = c.channels.cache.get(process.env.DISCORD_UPDATE_CHANNEL_ID ?? '') as TextChannel
  devChannel = c.channels.cache.get(process.env.DISCORD_DEV_CHANNEL_ID ?? '') as TextChannel

  // Set a status (activity) for the bot
  const activity: ActivityOptions = {
    name: "The intranet",
    type: ActivityType.Watching,
    url: "https://intra.epitech.eu"
  }
  c.user?.setActivity(activity)
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

const userCookiesMapping = new Map<string, Promo>()

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isAnySelectMenu()) return

  if (interaction.customId === "promoSelect") {
    const promo = interaction.values[0] as keyof typeof Promo
    userCookiesMapping.set(interaction.user.id, Promo[promo])

    const modal: ModalBuilder = new ModalBuilder()
      .setTitle("🍪 Cookie de connexion")
      .setCustomId("cookieModal")

    const cookieInput: TextInputBuilder = new TextInputBuilder()
      .setCustomId("cookieInput")
      .setPlaceholder("eyJ0eXAi..............")
      .setMinLength(100)
      .setMaxLength(300)
      .setStyle(TextInputStyle.Paragraph)
      .setLabel("Cookie")
      .setRequired(true)

    const nameInput: TextInputBuilder = new TextInputBuilder()
      .setCustomId("nameInput")
      .setPlaceholder("John Doe")
      .setMinLength(1)
      .setMaxLength(50)
      .setStyle(TextInputStyle.Short)
      .setLabel("Name")
      .setRequired(true)

    const firstYearInput: TextInputBuilder = new TextInputBuilder()
      .setCustomId("yearInput")
      .setPlaceholder("2022")
      .setMinLength(4)
      .setMaxLength(4)
      .setStyle(TextInputStyle.Short)
      .setLabel("Year (when you started Epitech)")
      .setRequired(true)
      .setValue(new Date().getFullYear().toString())

    const row : ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder({
      components: [cookieInput]
    })

    const secondRow : ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder({
      components: [nameInput]
    })

    const thirdRow : ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder({
      components: [firstYearInput]
    })

    modal.addComponents(row, secondRow, thirdRow)

    await interaction.showModal(modal)
  } else {
    await interaction.reply({ content: "❌ Une erreur est survenue !", ephemeral: true })
  }
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return

  if (interaction.customId === "cookieModal") {
    await interaction.deferReply({ ephemeral: true })
    const promo = userCookiesMapping.get(interaction.user.id)
    if (!promo) {
      await interaction.reply({ content: "❌ Vous n'avez pas sélectionné votre promo !", ephemeral: true })
      return
    }

    const cookie = interaction.fields.getField("cookieInput").value as string
    const name = interaction.fields.getField("nameInput").value as string
    const year = interaction.fields.getField("yearInput").value as string
    const userId = interaction.user.id

    const sourceUser = new SourceUser().fromJson({
      name,
      cookie,
      year: parseInt(year),
      promo,
      id: userId,
      disabled: false
    })

    // Check if year is coherent
    const currentYear = new Date().getFullYear()
    if (promo.startsWith("TEK")) {
      const promoYear = parseInt(promo.substring(4, 5))
      const yearDiff = currentYear - sourceUser.year
      if (yearDiff < 0 || yearDiff > 5) {
        await interaction.editReply({ content: "❌ L'année n'est pas cohérente !"})
        return
      }
      if (yearDiff !== promoYear - 1) {
        await interaction.editReply({ content: "❌ L'année n'est pas cohérente ! Vous ne pouvez pas être en " + promo + " si vous avez commencé en " + sourceUser.year})
        return
      }
    }

    const result = await connector.insertOrUpdate(SourceUser, sourceUser, { id: sourceUser.id })
    if (result) {
      if (result.isDiff) {
        await interaction.editReply({ content: "✅ Utilisateur mis à jour !"})
      } else {
        await interaction.editReply({ content: "👍 Votre cookie est toujours valide, donc pas de mise à jour !"})
      }
    } else {
      await interaction.editReply({ content: "🍪 Miam, merci pour le cookie !"})
    }
  } else {
    await interaction.reply({ content: "❌ Une erreur est survenue !", ephemeral: true })
  }
})


// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN).then()

export let updateChannel: TextChannel | undefined = undefined
export let devChannel: TextChannel | undefined = undefined
