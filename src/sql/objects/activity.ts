import { SqlBoolean, SqlType } from "../connector"
import Module from "./module"
import { IdOf } from "../../utils/types"
import { ActivityMainType, ActivityType } from "../../intra/dto"


export default class Activity extends SqlType {
  id: string
  moduleId: IdOf<Module>
  name: string
  isOngoing: SqlBoolean
  start: Date
  end: Date
  location: string
  description: string
  isProject: SqlBoolean
  isGraded: SqlBoolean
  hasMeeting: SqlBoolean
  url: string
  deadline: Date | null
  begin: Date
  endRegister: Date | null
  type: ActivityType
  mainType: ActivityMainType


  static databaseName = "activities"

  static getEmptyObject() {
    return new Activity()
  }

  constructor() {
    super()
    this.id = "acti-xxxx"
    this.moduleId = 0
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
      this.moduleId === other.moduleId &&
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
    this.moduleId = json.moduleId
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
