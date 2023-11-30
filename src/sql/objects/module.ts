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

  static getEmptyObject() {
    return new Module()
  }

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

  equals(other: Module): boolean {
    return this.id === other.id &&
      this.name === other.name &&
      this.nameFull === other.nameFull &&
      this.code === other.code &&
      this.semester === other.semester &&
      this.year === other.year &&
      this.city === other.city &&
      this.credits === other.credits &&
      this.isOngoing === other.isOngoing &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.isMandatory === other.isMandatory &&
      this.isRegistrationOpen === other.isRegistrationOpen &&
      this.endRegistration?.getTime() === other.endRegistration?.getTime() &&
      this.isRoadblock === other.isRoadblock &&
      this.promo === other.promo &&
      this.url === other.url
  }

  public fromJson(json: any): Module {
    this.id = json.id
    this.name = json.name
    this.nameFull = json.nameFull
    this.code = json.code
    this.semester = json.semester
    this.year = json.year
    this.city = json.city
    this.credits = json.credits
    this.isOngoing = json.isOngoing
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.isMandatory = json.isMandatory
    this.isRegistrationOpen = json.isRegistrationOpen
    this.endRegistration = json.endRegistration ? new Date(json.endRegistration) : null
    this.isRoadblock = json.isRoadblock
    this.promo = json.promo
    this.url = json.url
    return this
  }
}
