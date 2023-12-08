import { Promo } from "./sourceUser"
import SqlType from "../sqlType"
import { Column, Id, OneToMany, Table } from "../annotations"
import { SqlTypes } from "../types"
import ModuleFlag from "./moduleFlag"

@Table('modules')
export default class Module extends SqlType {
  @Id()
  @Column()
  public id: number
  @Column()
  public name: string
  @Column()
  public nameFull: string
  @Column()
  public code: string
  @Column()
  public semester: number
  @Column()
  public year: number
  @Column()
  public city: string
  @Column()
  public credits: number
  @Column()
  public isOngoing: boolean
  @Column('start', SqlTypes.DATE)
  public start: Date
  @Column('end', SqlTypes.DATE)
  public end: Date
  @Column()
  public isRegistrationOpen: boolean
  @Column('end_registration', SqlTypes.DATE, true)
  public endRegistration: Date | null
  @Column()
  public isRoadblock: boolean
  @Column()
  public isMandatory: boolean
  @Column()
  public promo: Promo
  @Column()
  public url: string
  @OneToMany(ModuleFlag, 'module_id')
  public flags: ModuleFlag[]

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
    this.flags = []
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
    this.flags = json.flags ?? []
    return this
  }
}
