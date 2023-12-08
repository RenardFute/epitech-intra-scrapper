import { getSyncedPromos } from "./sql/objects/sourceUser"
import { scrapModulesForPromo } from "./intra/modules"
import connector from "./sql/connector"
import Module from "./sql/objects/module"
import { scrapActivitiesForModule } from "./intra/activities"
import Activity from "./sql/objects/activity"
import { scrapProjectForActivity } from "./intra/projects"
import Project from "./sql/objects/project"
import { isDev } from "./index"
import { scrapEventsForActivity } from "./intra/events"
import { scrapLocations } from "./intra/locations"
import Event from "./sql/objects/event"
import SqlFilter from "./sql/sqlFilter"

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
    for (const module of modules) {
      const isNew = await module.save()
      if (isNew) {
        stats.inserted++
      } else {
        stats.updated++
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
  const modulesSynced = await connector.getMany(Module, all ? undefined : SqlFilter.from(Module,{isOngoing: true}))
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const module of modulesSynced) {
    const activities = await scrapActivitiesForModule(module)
    stats.fetched += activities.length
    for (const a of activities) {
      const result = await connector.insertOrUpdate(Activity, a, SqlFilter.from(Activity,{id: a.id}))
      if (result) {
        if (result.isDiff) {
          stats.updated++
        }
      } else {
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
  const modulesSynced = await connector.getMany(Module, all ? undefined : SqlFilter.from(Module,{isOngoing: true}))
  const activitiesSynced = (await connector.getMany(Activity, SqlFilter.from(Activity,{isProject: true}))).filter((a) => modulesSynced.find((m) => m.id === a.module))
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const activity of activitiesSynced) {
    const project = await scrapProjectForActivity(activity)
    if (!project) {
      if (isDev)
        console.error("No project found for activity", activity.id)
      continue
    }
    stats.fetched += 1
    const result = await connector.insertOrUpdate(Project, project, SqlFilter.from(Project,{activity: project.activity}))
    if (result) {
      if (result.isDiff) {
        stats.updated++
      }
    } else {
      stats.inserted++
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Projects scrap done", new Date().toLocaleString(), stats)
  return stats
}

/**
 * Scrap all events for either all activities or only ongoing activities
 * @returns Scrap statistics
 * @see ScrapStatistics
 * @see scrapEventsForActivity
 *
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export const eventsScrap = async (all?: boolean): Promise<ScrapStatistics> => {
  const modulesSynced = await connector.getMany(Module, all ? undefined : SqlFilter.from(Module,{isOngoing: true}))
  const activitiesSynced = (await connector.getMany(Activity)).filter((a) => modulesSynced.find((m) => m.id === a.module))
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const activity of activitiesSynced) {
    let events = await scrapEventsForActivity(activity)
    stats.fetched += events.length
    events = events.sort((a, b) => a.start.getTime() - b.start.getTime())
    for (const event of events) {
      const result = await connector.insertOrUpdate(Event, event, SqlFilter.from(Event,{id: event.id}))
      if (result) {
        if (result.isDiff) {
          stats.updated++
        }
      } else {
        stats.inserted++
      }
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Events scrap done", new Date().toLocaleString(), stats)
  return stats
}

export const locationsScrap = async (): Promise<ScrapStatistics> => {
  const locations = await scrapLocations()
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const location of locations) {
    const isNew = await location.save()
    stats.fetched++
    if (isNew) {
      stats.inserted++
    } else {
      stats.updated++
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Locations scrap done", new Date().toLocaleString(), stats)
  return stats
}

/**
 * Start all schedulers
 * Delay the start of the schedulers to the next hour
 * @see modulesScrap
 * @see activitiesScrap
 * @see eventsScrap
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
    eventsScrap().then()
    setInterval(eventsScrap, hourFrequency)
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
