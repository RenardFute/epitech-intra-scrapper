import { SqlBoolean, SqlType } from "../connector"
import { Promo } from "./sourceUser"
import { hashCode } from "../../utils/string"

export default class Module extends SqlType {
  id: number
  name: string
  nameFull: string
  code: string
  semester: number
  year: number
  city: string
  credits: number
  isOngoing: SqlBoolean
  start: Date
  end: Date
  isRegistrationOpen: SqlBoolean
  endRegistration: Date | null
  isRoadblock: SqlBoolean
  isMandatory: SqlBoolean
  promo: Promo
  url: string

  static databaseName = "modules"

  constructor() {
    super()
    this.id = 0
    this.name = ""
    this.nameFull = ""
    this.code = ""
    this.semester = 0
    this.year = 0
    this.city = ""
    this.credits = 0
    this.isOngoing = false
    this.start = new Date()
    this.end = new Date()
    this.isMandatory = false
    this.isRegistrationOpen = false
    this.endRegistration = new Date()
    this.isRoadblock = false
    this.promo = Promo.TEK_1
    this.url = ""
  }

  static computeId(code: string, semester: number, year: number, start: Date, city: string): number {
    let id = hashCode(code)
    id = id * 31 + semester
    id = id * 31 + year
    id = id * 31 + start.getTime()
    id = id * 31 + hashCode(city)

    id = id > 0 ? id : -id
    return id
  }
}
