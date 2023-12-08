import { IdOf } from "../../utils/types"
import Activity from "./activity"
import SqlType from "../sqlType"
import { Column, Id, ManyToOne, Table } from "../annotations"
import { SqlTypes } from "../types"

@Table('projects')
export default class Project extends SqlType {
  @Id()
  @ManyToOne(Activity)
  @Column('activity_id', SqlTypes.STRING)
  public activity: IdOf<Activity> | Activity
  @Column()
  public name: string
  @Column('begin', SqlTypes.DATE)
  public begin: Date
  @Column('end', SqlTypes.DATE)
  public end: Date
  @Column('end_register', SqlTypes.DATE, true)
  public endRegister: Date | null
  @Column('deadline', SqlTypes.DATE, true)
  public deadline: Date | null
  @Column()
  public maxGroupSize: number
  @Column()
  public minGroupSize: number

  static getEmptyObject() {
    return new Project()
  }

  constructor() {
    super()
    this.activity = 'acti-xxxx'
    this.name = ""
    this.begin = new Date()
    this.end = new Date()
    this.endRegister = null
    this.deadline = null
    this.maxGroupSize = 0
    this.minGroupSize = 0
  }

  equals(other: Project): boolean {
    return this.activity === other.activity &&
      this.name === other.name &&
      this.begin.getTime() === other.begin.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.endRegister?.getTime() === other.endRegister?.getTime() &&
      this.deadline?.getTime() === other.deadline?.getTime() &&
      this.maxGroupSize === other.maxGroupSize &&
      this.minGroupSize === other.minGroupSize
  }

  public fromJson(json: any): Project {
    this.activity = json.activity
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
