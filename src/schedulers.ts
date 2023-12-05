import { getSyncedPromos } from "./sql/objects/sourceUser"
import { createFlags, findFlags, scrapModulesForPromo } from "./intra/modules"
import connector from "./sql/connector"
import Module from "./sql/objects/module"
import { scrapActivitiesForModule } from "./intra/activities"
import Activity from "./sql/objects/activity"
import { scrapRoomsForDate } from "./oros/rooms"
import Room from "./sql/objects/room"
import { sendModuleUpdateMessage } from "./discord/messages/modules/update"
import { sendModuleCreatedMessage } from "./discord/messages/modules/new"
import { sendRoomCreatedMessage } from "./discord/messages/oros/new"
import { sendRoomUpdateMessage } from "./discord/messages/oros/update"
import { scrapProjectForActivity } from "./intra/projects"
import Project from "./sql/objects/project"
import ModuleFlag from "./sql/objects/moduleFlag"
import { ModuleFlags } from "./intra/dto"
import { isDev } from "./index"

const hourFrequency = 1000 * 60 * 60 // Each hour

/**
 * Custom type to summarize scrap statistics
 * @author Axel ECKENBERG
 * @since 1.0.0
 */
type ScrapStatistics = { fetched: number, inserted: number, updated: number, deleted: number, time: number }

/**
 * Scrap all modules for all synced promos
 * @returns Scrap statistics
 * @see ScrapStatistics
 * @see getSyncedPromos
 * @see scrapModulesForPromo
 *
 * @author Axel ECKENBERG
 * @since 1.0.0
 */
export const modulesScrap = async (): Promise<ScrapStatistics> => {
  const syncedPromos = await getSyncedPromos()
  const totalStats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }

  for (const promo of syncedPromos) {
    const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
    const modules = await scrapModulesForPromo(promo)
    stats.fetched = modules.length
    for (const r of modules) {
      const result = await connector.insertOrUpdate(Module, r.module, {id: r.module.id})
      if (result) {
        if (result.isDiff) {
          stats.updated++
          await sendModuleUpdateMessage(result)
        }
      } else {
        stats.inserted++
        await sendModuleCreatedMessage(r.module)
      }
      await connector.delete(ModuleFlag, { moduleId: r.module.id })
      const flagsToInsert = createFlags(findFlags(r.flags), r.module)
      for (const flag of flagsToInsert) {
        if (flagsToInsert.length > 1 && flag.flag === ModuleFlags.NONE)
          continue
        await connector.insert(ModuleFlag, flag)
      }
    }
    stats.time = Date.now() - stats.time
    console.log("Modules scrap done for promo", promo, new Date().toLocaleString(), stats)
    totalStats.fetched += stats.fetched
    totalStats.inserted += stats.inserted
    totalStats.updated += stats.updated
    totalStats.deleted += stats.deleted
  }
  totalStats.time = Date.now() - totalStats.time
  return totalStats
}

/**
 * Scrap all activities for all ongoing modules
 * @returns Scrap statistics
 * @see ScrapStatistics
 * @see getSyncedPromos
 * @see scrapActivitiesForModule
 *
 * @author Axel ECKENBERG
 * @since 1.0.0
 */
export const activitiesScrap = async (all?: boolean): Promise<ScrapStatistics> => {
  const modulesSynced = await connector.getMany(Module, all ? undefined : {isOngoing: 1})
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const module of modulesSynced) {
    const activities = await scrapActivitiesForModule(module)
    stats.fetched += activities.length
    for (const a of activities) {
      const result = await connector.insertOrUpdate(Activity, a, {id: a.id})
      if (result) {
        if (result.isDiff) {
          // TODO: Notify activity update
          stats.updated++
        }
      } else {
        // TODO: Notify new activity
        stats.inserted++
      }
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Activities scrap done", new Date().toLocaleString(), stats)
  return stats
}

/**
 * Scrap project for all activities with a project
 * @returns Scrap statistics
 * @see ScrapStatistics
 * @see getSyncedPromos
 * @see scrapProjectForActivity
 *
 * @author Axel ECKENBERG
 * @since 1.0.0
 */
export const projectScrap = async (all?: boolean): Promise<ScrapStatistics> => {
  const modulesSynced = await connector.getMany(Module, all ? undefined : {isOngoing: 1})
  const activitiesSynced = (await connector.getMany(Activity, {isProject: true})).filter((a) => modulesSynced.find((m) => m.id === a.moduleId))
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const activity of activitiesSynced) {
    const project = await scrapProjectForActivity(activity)
    if (!project) {
      if (isDev)
        console.error("No project found for activity", activity)
      continue
    }
    stats.fetched += 1
    const result = await connector.insertOrUpdate(Project, project, {activityId: project.activityId})
    if (result) {
      if (result.isDiff) {
        // TODO: Notify project update
        stats.updated++
      }
    } else {
      // TODO: Notify new project
      stats.inserted++
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Projects scrap done", new Date().toLocaleString(), stats)
  return stats
}

/**
 * Scrap all rooms for the current day
 * @returns Scrap statistics
 * @see ScrapStatistics
 * @see scrapRoomsForDate
 *
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export const roomsScrap = async (): Promise<ScrapStatistics> => {
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  let rooms = await scrapRoomsForDate(new Date())
  stats.fetched = rooms.length
  rooms = rooms.sort((a, b) => a.start.getTime() - b.start.getTime())
  for (const room of rooms) {
    const result = await connector.insertOrUpdate(Room, room, {id: room.id})
    if (result) {
      if (result.isDiff) {
        await sendRoomUpdateMessage(result)
        stats.updated++
      }
    } else {
      await sendRoomCreatedMessage(room)
      stats.inserted++
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Rooms scrap done", new Date().toLocaleString(), stats)
  return stats
}

/**
 * Start all schedulers
 * Delay the start of the schedulers to the next hour
 * @see modulesScrap
 * @see activitiesScrap
 * @see roomsScrap
 * @see hourFrequency
 *
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export const startSchedulers = async () => {
  const delayBeforeNextHour = 1000 * 60 * 60 - (Date.now() % (1000 * 60 * 60))

  console.log("Schedulers started @", new Date().toLocaleString())
  console.log("  -> Next hour in", delayBeforeNextHour / 1000 / 60, "minutes")

  setTimeout(() => {
    modulesScrap().then()
    setInterval(modulesScrap, hourFrequency)
  }, delayBeforeNextHour)

  setTimeout(() => {
    activitiesScrap().then(
      () => projectScrap().then()
    )
    setInterval(activitiesScrap, hourFrequency)
  }, delayBeforeNextHour)

  setTimeout(() => {
    roomsScrap().then()
    setInterval(roomsScrap, hourFrequency)
  }, delayBeforeNextHour)

  setInterval(async () => {
    try {
      connector.query("SELECT 1").then()
    } catch (e) {
      console.error("DB connection lost", new Date().toLocaleString())
      console.error(e)
    }
  }, 1000 * 60)


  const timeout: {Value: any}[] = await connector.query("SHOW VARIABLES LIKE 'interactive_timeout'")
  console.log("DB connection refreshed, will timeout after", timeout[0].Value, "seconds")
  setTimeout(async () => {
    connector.close()
    await connector.connect()
  }, parseInt(timeout[0].Value) * 1000 - 1000 * 60)
}
