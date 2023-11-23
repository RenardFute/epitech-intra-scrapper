import { getSyncedPromos } from "./sql/objects/sourceUser"
import { fetchModulesForPromo } from "./intra/modules"
import connector from "./sql/connector"
import Module from "./sql/objects/module"
import { fetchActivitiesForModule } from "./intra/activities";
import Activity from "./sql/objects/activity";
import { fetchRoomsForDate } from "./oros/rooms";
import Room from "./sql/objects/room";

const modulesScrapFrequency = 1000 * 60 * 60 * 24 * 1 // Each day
const activitiesScrapFrequency = 1000 * 60 * 60 * 12 // Twice a day
const roomsScrapFrequency = 1000 * 60 * 60 // Each hour

const modulesScrap = async () => {
  const syncedPromos = await getSyncedPromos()

  for (const promo of syncedPromos) {
    const modules = await fetchModulesForPromo(promo)
    for (const m of modules) {
      const result = await connector.insertOrUpdate(Module, m, {id: m.id})
      if (result) {
        if (result.isDiff) {
          // TODO: Notify module update
        }
      } else {
        // TODO: Notify new module
      }
    }
  }
}

const activitiesScrap = async () => {
  const modulesSynced = await connector.getMany(Module, {isOngoing: true})
  for (const module of modulesSynced) {
    const activities = await fetchActivitiesForModule(module)
    for (const a of activities) {
      const result = await connector.insertOrUpdate(Activity, a, {id: a.id})
      if (result) {
        if (result.isDiff) {
          // TODO: Notify activity update
        }
      } else {
        // TODO: Notify new activity
      }
    }
    // Wait a bit to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

const roomsScrap = async () => {
  const rooms = await fetchRoomsForDate(new Date())
  for (const room of rooms) {
    const result = await connector.insertOrUpdate(Room, room, {id: room.id})
    if (result) {
      if (result.isDiff) {
        // TODO: Notify room update
      }
    } else {
      // TODO: Notify new room
    }
  }
}

const startSchedulers = () => {
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
