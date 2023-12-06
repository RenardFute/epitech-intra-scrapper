import { SqlBoolean, SqlType } from "../connector"


export default class Location extends SqlType{
  id: string
  name: string
  disabled?: SqlBoolean
  floor?: number
  imagePath?: string

  static databaseName = "locations"

  static getEmptyObject() {
    return new Location()
  }

  constructor() {
    super()
    this.id = "DEV/XXX"
    this.name = "Dev"
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
    return this
  }
}
