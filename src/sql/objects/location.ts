import SqlType from "../sqlType"
import { Column, ManyToMany, Table } from "../annotations"
import { SqlTypes } from "../types"
import LocationType from "./locationType"

@Table('locations')
export default class Location extends SqlType{
  @Column()
  public id: string
  @Column()
  public name: string
  @Column('disabled', SqlTypes.BOOLEAN, true)
  public disabled: boolean | null
  @Column('floor', SqlTypes.NUMBER, true)
  public floor: number | null
  @Column('image_path', SqlTypes.STRING, true)
  public imagePath: string | null
  @ManyToMany(LocationType, 'locations_with_types')
  public types: LocationType[]

  static getEmptyObject() {
    return new Location()
  }

  constructor() {
    super()
    this.id = "DEV/XXX"
    this.name = "Dev"
    this.disabled = null
    this.floor = null
    this.imagePath = null
    this.types = []
  }

  equals(other: Location): boolean {
    return this.id === other.id &&
      this.name === other.name &&
      this.disabled === other.disabled &&
      this.floor === other.floor
  }

  public fromJson(json: any): Location {
    this.id = json.id
    this.name = json.name
    this.disabled = json.disabled
    this.floor = json.floor
    this.imagePath = json.imagePath
    this.types = json.types ?? []
    return this
  }
}
