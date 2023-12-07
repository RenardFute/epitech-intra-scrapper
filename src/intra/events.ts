import Activity from "../sql/objects/activity"
import { fetchActivity } from "./scrappers"
import dayjs from "dayjs"
import Event from "../sql/objects/event"

export const scrapEventsForActivity = async (activity: Activity): Promise<Event[]> => {
  const dto = await fetchActivity(activity)
  if (!dto) {
    return []
  }
  const events: Event[] = []
  for (const event of dto.events) {
    const index = parseInt(event.num_event) - 1
    const e = new Event().fromJson({
      activity: activity.id,
      end: dayjs(event.end, "YYYY-MM-DD HH:mm:ss").toDate(),
      id: Event.computeId(activity.id, index),
      location: event.location,
      sessionIndex: index,
      start: dayjs(event.begin, "YYYY-MM-DD HH:mm:ss").toDate()
    })
    events.push(e)
  }
  return events
}
