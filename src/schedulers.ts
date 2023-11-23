import { getSyncedPromos } from "./sql/objects/sourceUser"
import { fetchModulesForPromo } from "./intra/modules"
import connector from "./sql/connector"
import Module from "./sql/objects/module"
import { fetchActivitiesForModule } from "./intra/activities"
import Activity from "./sql/objects/activity"
import { fetchRoomsForDate } from "./oros/rooms"
import Room from "./sql/objects/room"
import { sendModuleUpdateMessage } from "./discord/messages/modules/update"
import { sendModuleCreatedMessage } from "./discord/messages/modules/new"

const modulesScrapFrequency = 1000 * 60 * 60 * 24 * 1 // Each day
const activitiesScrapFrequency = 1000 * 60 * 60 * 12 // Twice a day
const roomsScrapFrequency = 1000 * 60 * 60 // Each hour

type ScrapStatistics = { fetched: number, inserted: number, updated: number, deleted: number, time: number }

export const modulesScrap = async () => {
  const syncedPromos = await getSyncedPromos()

  for (const promo of syncedPromos) {
    const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
    const modules = await fetchModulesForPromo(promo)
    stats.fetched = modules.length
    for (const m of modules) {
      const result = await connector.insertOrUpdate(Module, m, {id: m.id})
      if (result) {
        if (result.isDiff) {
          stats.updated++
          await sendModuleUpdateMessage(result)
        }
      } else {
        stats.inserted++
        await sendModuleCreatedMessage(m)
      }
    }
    stats.time = Date.now() - stats.time
    console.log("Modules scrap done for promo", promo, new Date().toLocaleString(), stats)
  }
}

export const activitiesScrap = async () => {
  const modulesSynced = await connector.getMany(Module, {isOngoing: true})
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  for (const module of modulesSynced) {
    const activities = await fetchActivitiesForModule(module)
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
    // Wait a bit to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  stats.time = Date.now() - stats.time
  console.log("Activities scrap done", new Date().toLocaleString(), stats)
}

export const roomsScrap = async () => {
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  const rooms = await fetchRoomsForDate(new Date())
  stats.fetched = rooms.length
  for (const room of rooms) {
    const result = await connector.insertOrUpdate(Room, room, {id: room.id})
    if (result) {
      if (result.isDiff) {
        // TODO: Notify room update
        stats.updated++
      }
    } else {
      // TODO: Notify new room
      stats.inserted++
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Rooms scrap done", new Date().toLocaleString(), stats)
}

export const startSchedulers = () => {
  const delayBeforeMidnight = 1000 * 60 * 60 * 24 - (Date.now() % (1000 * 60 * 60 * 24))
  const delayBeforeMidday = 1000 * 60 * 60 * 12 - (Date.now() % (1000 * 60 * 60 * 12))
  const delayBeforeNextHour = 1000 * 60 * 60 - (Date.now() % (1000 * 60 * 60))

  setTimeout(() => {
    modulesScrap()
    setInterval(modulesScrap, modulesScrapFrequency)
  }, delayBeforeMidnight)

  setTimeout(() => {
    activitiesScrap()
    setInterval(activitiesScrap, activitiesScrapFrequency)
  }, delayBeforeMidday)

  setTimeout(() => {
    roomsScrap()
    setInterval(roomsScrap, roomsScrapFrequency)
  }, delayBeforeNextHour)
}
