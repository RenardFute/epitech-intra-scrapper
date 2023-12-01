import Room, { Rooms } from "../sql/objects/room"
import connector from "../sql/connector"
import Activity from "../sql/objects/activity"
import Module from "../sql/objects/module"
import { findAsyncSequential } from "../utils/arrays"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
dayjs.extend(timezone)
dayjs.extend(utc)


type RoomDTO = Array<{
  name: string,
  hide_if_free: boolean,
  rooms: {
    [key in Rooms]: {
      activities: Array<{
        activity_title: string,
        start_at: number,
        end_at: number,
        oros_tags: any[],
        type?: string,
      }>,
      force_closed?: boolean,
      force_closed_message?: string,
      french_gender?: 'masculine' | 'feminine'
    }
  }
}>

export const fetchRoomsForDate = async (date: Date): Promise<Room[]> => {
  const url ="https://api.oros.dahobul.com/rooms-activities?from=" + date.toISOString().split("T")[0] + "&to=" + date.toISOString().split("T")[0]
  const data: RoomDTO | undefined = await fetch(url)
    .then((res) => res.json())
    .then((res) => {
      return res as RoomDTO
    })
    .catch((err) => {
      console.error(err)
      return undefined
    })

  if (!data) return []

  const rooms = data.map((o) => o.rooms).flat()
  const result = [] as Room[]

  for (const place of rooms) {
    for (const room of Object.keys(place) as Rooms[]) {
      const activities = place[room].activities
      let index = 0
      let oldActivity: Activity | null = null
      for (const activity of activities) {
        const matchingActivities = await connector.getMany(Activity, {
          name: activity.activity_title
        })

        if (!matchingActivities) {
          index = 0
          continue
        }
        const matchingActivity = await findAsyncSequential(matchingActivities, async (a) => {
          const module = await connector.getOne(Module, {id: a.moduleId})
          if (!module) return false
          return module.isOngoing === true
        })

        if (!matchingActivity) {
          index = 0
          continue
        }
        if (oldActivity && oldActivity.equals(matchingActivity)) {
          index++
        } else {
          index = 0
        }

        const sample = dayjs().tz('Europe/Paris').toDate().getTimezoneOffset()
        const end = dayjs(activity.end_at).utc().add(sample, 'minutes').toDate()
        const start = dayjs(activity.start_at).utc().add(sample, 'minutes').toDate()
        const id = Room.computeId(matchingActivity.id, index)

        const newRoom = new Room()
        newRoom.activityId = matchingActivity.id
        newRoom.end = end
        newRoom.id = id
        newRoom.room = room
        newRoom.start = start
        newRoom.sessionIndex = index
        result.push(newRoom)

        oldActivity = matchingActivity
      }
    }
  }

  return result
}
