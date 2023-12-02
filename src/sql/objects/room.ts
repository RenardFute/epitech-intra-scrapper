import { IdOf } from "../../utils/types"
import Activity from "./activity"
import { SqlType } from "../connector"
import dayjs from "dayjs"
import { Rooms } from "../../intra/dto"


export default class Room extends SqlType{
  id: string
  activityId: IdOf<Activity>
  start: Date
  end: Date
  room: Rooms
  sessionIndex: number

  static databaseName = "rooms"

  static getEmptyObject() {
    return new Room()
  }

  constructor() {
    super()
    this.id = "room-xxxx-0"
    this.activityId = "acti-xxxx"
    this.start = new Date()
    this.end = new Date()
    this.room = "Accueil"
    this.sessionIndex = 0
  }

  static computeId = (activityId: IdOf<Activity>, index: number): IdOf<Room> => {
    return (activityId + "-" + index).replace("acti-", "room-")
  }

  public startToString(): string {
    return dayjs(this.start).utc().tz('Europe/Paris').format("HH[h]mm")
  }

  public endToString(): string {
    return dayjs(this.end).utc().tz('Europe/Paris').format("HH[h]mm")
  }

  equals(other: Room): boolean {
    return this.id === other.id &&
      this.activityId === other.activityId &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.room === other.room &&
      this.sessionIndex === other.sessionIndex
  }

  public fromJson(json: any): Room {
    this.id = json.id
    this.activityId = json.activityId
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.room = json.room
    this.sessionIndex = json.sessionIndex
    return this
  }
}
