import { IdOf } from "../../utils/types"
import Activity from "./activity"
import dayjs from "dayjs"
import Location from "./location"
import SqlType from "../sqlType"
import { Column, ManyToOne, Table } from "../annotations"
import { SqlTypes } from "../types"

@Table('events')
export default class Event extends SqlType {
  @Column()
  public id: string
  @ManyToOne(Activity)
  @Column('activity_id', SqlTypes.STRING)
  public activity: IdOf<Activity> | Activity
  @Column('start', SqlTypes.DATE)
  public start: Date
  @Column('end', SqlTypes.DATE)
  public end: Date
  @ManyToOne(Location)
  @Column('location', SqlTypes.STRING)
  public location: IdOf<Location> | Location
  @Column()
  public sessionIndex: number

  static getEmptyObject() {
    return new Event()
  }

  constructor() {
    super()
    this.id = "event-xxxx-0"
    this.activity = "acti-xxxx"
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
      this.activity === other.activity &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.location === other.location &&
      this.sessionIndex === other.sessionIndex
  }

  public fromJson(json: any): Event {
    this.id = json.id
    this.activity = json.activity
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.location = json.location
    this.sessionIndex = json.sessionIndex
    return this
  }
}
