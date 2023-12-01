import SourceUser, { getSyncedPromos } from "./sql/objects/sourceUser"
import { fetchModulesForPromo } from "./intra/modules"
import connector from "./sql/connector"
import Module from "./sql/objects/module"
import { fetchActivitiesForModule } from "./intra/activities"
import Activity from "./sql/objects/activity"
import { fetchRoomsForDate } from "./oros/rooms"
import Room from "./sql/objects/room"
import { sendModuleUpdateMessage } from "./discord/messages/modules/update"
import { sendModuleCreatedMessage } from "./discord/messages/modules/new"
import { sendRoomCreatedMessage } from "./discord/messages/oros/new"
import { sendRoomUpdateMessage } from "./discord/messages/oros/update"
import { fetchNotificationForUser } from "./intra/notification"
import { getNotificationTypeFromEnum, NotificationType } from "./sql/objects/notifications/notification"
import MarkNotification from "./sql/objects/notifications/markNotification"
import sendNewMarkNotification from "./discord/messages/notifications/mark/new"

const hourFrequency = 1000 * 60 * 60 // Each hour

type ScrapStatistics = { fetched: number, inserted: number, updated: number, deleted: number, time: number }

export const modulesScrap = async (): Promise<ScrapStatistics> => {
  const syncedPromos = await getSyncedPromos()
  const totalStats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }

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
    totalStats.fetched += stats.fetched
    totalStats.inserted += stats.inserted
    totalStats.updated += stats.updated
    totalStats.deleted += stats.deleted
  }
  totalStats.time = Date.now() - totalStats.time
  return totalStats
}

export const activitiesScrap = async (): Promise<ScrapStatistics> => {
  const modulesSynced = await connector.getMany(Module, {isOngoing: 1})
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
  }
  stats.time = Date.now() - stats.time
  console.log("Activities scrap done", new Date().toLocaleString(), stats)
  return stats
}

export const roomsScrap = async (): Promise<ScrapStatistics> => {
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  let rooms = await fetchRoomsForDate(new Date())
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

export const notificationScrap = async (): Promise<ScrapStatistics> => {
  const stats: ScrapStatistics = { fetched: 0, inserted: 0, updated: 0, deleted: 0, time: Date.now() }
  const sourceUsers = await connector.getMany(SourceUser, {disabled: 0})
  for (const user of sourceUsers) {
    const notifications = await fetchNotificationForUser(user)
    stats.fetched += notifications.length
    for (const n of notifications) {
      const result = await connector.insertOrUpdate(getNotificationTypeFromEnum(n.notificationType), n, {id: n.id})
      if (result) {
        if (result.isDiff) {
          // TODO: Notify activity update
          stats.updated++
        }
      } else {
        switch (n.notificationType) {
          case NotificationType.NEW_MARK:
            await sendNewMarkNotification(n as MarkNotification)
            break
          default:
            throw new Error("Unknown notification type")
        }
        stats.inserted++
      }
    }
  }
  stats.time = Date.now() - stats.time
  console.log("Notifications scrap done", new Date().toLocaleString(), stats)
  return stats
}

export const startSchedulers = () => {
  const delayBeforeNextHour = 1000 * 60 * 60 - (Date.now() % (1000 * 60 * 60))

  console.log("Schedulers started", new Date().toLocaleString())
  console.log("  -> Next hour in", delayBeforeNextHour / 1000 / 60, "minutes")

  setTimeout(() => {
    modulesScrap().then()
    setInterval(modulesScrap, hourFrequency)
  }, delayBeforeNextHour)

  setTimeout(() => {
    activitiesScrap().then()
    setInterval(activitiesScrap, hourFrequency)
  }, delayBeforeNextHour)

  setTimeout(() => {
    roomsScrap().then()
    setInterval(notificationScrap, hourFrequency)
  }, delayBeforeNextHour)

  setInterval(() => {
    try {
      connector.query("SELECT 1").then()
    } catch (e) {
      console.error("DB connection lost", new Date().toLocaleString())
      console.error(e)
    }
  }, 1000 * 60)
}
