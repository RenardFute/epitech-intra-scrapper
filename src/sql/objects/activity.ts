import { SqlBoolean, SqlType } from "../connector"
import Module from "./module"
import { IdOf } from "../../utils/types"
import { hashCode } from "../../utils/string"


export default class Activity extends SqlType {
  id: number
  moduleId: IdOf<Module>
  name: string
  isOngoing: SqlBoolean
  start: Date
  end: Date
  isMandatory: SqlBoolean
  location: string
  description: string
  isProject: boolean
  isGraded: SqlBoolean
  hasMeeting: SqlBoolean
  url: string

  static databaseName = "activities"

  static getEmptyObject() {
    return new Activity()
  }

  constructor() {
    super()
    this.id = 0
    this.moduleId = 0
    this.name = ""
    this.isOngoing = false
    this.start = new Date()
    this.end = new Date()
    this.isMandatory = false
    this.location = ""
    this.description = ""
    this.isProject = false
    this.isGraded = false
    this.hasMeeting = false
    this.url = ""
  }

  static computeId(name: string, module: Module, url: string): number {
    let id = hashCode(name)
    id = id * 31 + module.id
    id = id * 31 + hashCode(url)

    id = id > 0 ? id : -id
    return id
  }

  equals(other: Activity): boolean {
    return this.id === other.id &&
      this.moduleId === other.moduleId &&
      this.name === other.name &&
      this.isOngoing === other.isOngoing &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.isMandatory === other.isMandatory &&
      this.location === other.location &&
      this.description === other.description &&
      this.isProject === other.isProject &&
      this.isGraded === other.isGraded &&
      this.hasMeeting === other.hasMeeting &&
      this.url === other.url
  }

  public fromJson(json: any): Activity {
    this.id = json.id
    this.moduleId = json.moduleId
    this.name = json.name
    this.isOngoing = json.isOngoing
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.isMandatory = json.isMandatory
    this.location = json.location
    this.description = json.description
    this.isProject = json.isProject
    this.isGraded = json.isGraded
    this.hasMeeting = json.hasMeeting
    this.url = json.url
    return this
  }
}
