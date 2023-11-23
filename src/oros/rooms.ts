import Room, { Rooms } from "../sql/objects/room"
import connector from "../sql/connector";
import Activity from "../sql/objects/activity";


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
      for (const activity of activities) {
        const matchingActivity = await connector.getOne(Activity, {
          name: activity.activity_title,
          isOngoing: 1
        })

        if (!matchingActivity) continue

        const end = new Date(activity.end_at)
        const start = new Date(activity.start_at)
        const id = Room.computeId(matchingActivity.id, start)

        const newRoom: Room = {
          activityId: matchingActivity.id,
          end,
          id,
          room,
          start
        }
        result.push(newRoom)
      }
    }
  }

  return result
}
