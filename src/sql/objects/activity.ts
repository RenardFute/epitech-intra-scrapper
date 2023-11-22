import { SqlType } from "../connector"
import Module from "./module"
import { IdOf } from "../../utils/types"
import { hashCode } from "../../utils/string"


export default class Activity extends SqlType {
  id: number
  moduleId: IdOf<Module>
  name: string
  isOngoing: boolean
  start: Date
  end: Date
  isMandatory: boolean
  location: string
  description: string
  isProject: boolean
  isGraded: boolean
  hasMeeting: boolean
  url: string

  static databaseName = "activities"

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
}
