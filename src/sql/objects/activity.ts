import { IdOf } from "../../utils/types"
import { ActivityMainType, ActivityType } from "../../intra/dto"
import { Column, ManyToOne, Table } from "../annotations"
import Location from "./location"
import SqlType from "../sqlType"
import { SqlTypes } from "../types"
import Module from "./module"

@Table('activities')
export default class Activity extends SqlType {
  @Column()
  public id: string
  @ManyToOne(Module)
  @Column('module_id', SqlTypes.NUMBER)
  public module: IdOf<Module> | Module
  @Column()
  public name: string
  @Column()
  public isOngoing: boolean
  @Column('start', SqlTypes.DATE)
  public start: Date
  @Column('end', SqlTypes.DATE)
  public end: Date
  @ManyToOne(Location)
  @Column('location', SqlTypes.STRING)
  public location: IdOf<Location> | Location
  @Column()
  public description: string
  @Column()
  public isProject: boolean
  @Column()
  public isGraded: boolean
  @Column()
  public hasMeeting: boolean
  @Column()
  public url: string
  @Column('deadline', SqlTypes.DATE, true)
  public deadline: Date | null
  @Column('begin', SqlTypes.DATE)
  public begin: Date
  @Column('end_register', SqlTypes.DATE, true)
  public endRegister: Date | null
  @Column()
  public type: ActivityType
  @Column()
  public mainType: ActivityMainType

  static getEmptyObject() {
    return new Activity()
  }

  constructor() {
    super()
    this.id = "acti-xxxx"
    this.module = 0
    this.name = ""
    this.isOngoing = false
    this.start = new Date()
    this.end = new Date()
    this.location = ""
    this.description = ""
    this.isProject = false
    this.isGraded = false
    this.hasMeeting = false
    this.url = ""
    this.deadline = null
    this.begin = new Date()
    this.endRegister = null
    this.type = "Project"
    this.mainType = "other"
  }

  equals(other: Activity): boolean {
    return this.id === other.id &&
      this.module === other.module &&
      this.name === other.name &&
      this.isOngoing === other.isOngoing &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.location === other.location &&
      this.description === other.description &&
      this.isProject === other.isProject &&
      this.isGraded === other.isGraded &&
      this.hasMeeting === other.hasMeeting &&
      this.url === other.url &&
      this.deadline?.getTime() === other.deadline?.getTime() &&
      this.begin.getTime() === other.begin.getTime() &&
      this.endRegister?.getTime() === other.endRegister?.getTime() &&
      this.type === other.type &&
      this.mainType === other.mainType
  }

  public fromJson(json: any): Activity {
    this.id = json.id
    this.module = json.module
    this.name = json.name
    this.isOngoing = json.isOngoing
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.location = json.location
    this.description = json.description
    this.isProject = json.isProject
    this.isGraded = json.isGraded
    this.hasMeeting = json.hasMeeting
    this.url = json.url
    this.deadline = json.deadline ? new Date(json.deadline) : null
    this.begin = new Date(json.begin)
    this.endRegister = json.endRegister ? new Date(json.endRegister) : null
    this.type = json.type
    this.mainType = json.mainType
    return this
  }
}
