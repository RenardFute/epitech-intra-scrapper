import { IdOf } from "../../utils/types"
import Activity from "./activity"
import SqlType from "../sqlType"

export default class Project extends SqlType {
  activityId: IdOf<Activity>
  name: string
  begin: Date
  end: Date
  endRegister: Date | null
  deadline: Date | null
  maxGroupSize: number
  minGroupSize: number


  static databaseName = "projects"

  static getEmptyObject() {
    return new Project()
  }

  constructor() {
    super()
    this.activityId = 'acti-xxxx'
    this.name = ""
    this.begin = new Date()
    this.end = new Date()
    this.endRegister = null
    this.deadline = null
    this.maxGroupSize = 0
    this.minGroupSize = 0
  }

  equals(other: Project): boolean {
    return this.activityId === other.activityId &&
      this.name === other.name &&
      this.begin.getTime() === other.begin.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.endRegister?.getTime() === other.endRegister?.getTime() &&
      this.deadline?.getTime() === other.deadline?.getTime() &&
      this.maxGroupSize === other.maxGroupSize &&
      this.minGroupSize === other.minGroupSize
  }

  public fromJson(json: any): Project {
    this.activityId = json.activityId
    this.name = json.name
    this.begin = json.begin
    this.end = json.end
    this.endRegister = json.endRegister
    this.deadline = json.deadline
    this.maxGroupSize = json.maxGroupSize
    this.minGroupSize = json.minGroupSize
    return this
  }
}
