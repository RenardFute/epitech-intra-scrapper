import { IdOf } from "../../utils/types"
import Activity from "./activity"
import { SqlType } from "../connector"
import dayjs from "dayjs"
import Location from "./location"


export default class Event extends SqlType{
  id: string
  activityId: IdOf<Activity>
  start: Date
  end: Date
  location: IdOf<Location>
  sessionIndex: number

  static databaseName = "events"

  static getEmptyObject() {
    return new Event()
  }

  constructor() {
    super()
    this.id = "event-xxxx-0"
    this.activityId = "acti-xxxx"
    this.start = new Date()
    this.end = new Date()
    this.location = "Accueil"
    this.sessionIndex = 0
  }

  static computeId = (activityId: IdOf<Activity>, index: number): IdOf<Event> => {
    return (activityId + "-" + index).replace("acti-", "event-")
  }

  public startToString(): string {
    return dayjs(this.start).utc().tz('Europe/Paris').format("HH[h]mm")
  }

  public endToString(): string {
    return dayjs(this.end).utc().tz('Europe/Paris').format("HH[h]mm")
  }

  equals(other: Event): boolean {
    return this.id === other.id &&
      this.activityId === other.activityId &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.location === other.location &&
      this.sessionIndex === other.sessionIndex
  }

  public fromJson(json: any): Event {
    this.id = json.id
    this.activityId = json.activityId
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.location = json.location
    this.sessionIndex = json.sessionIndex
    return this
  }
}
