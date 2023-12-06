import { SqlType } from "../connector"
import { IdOf } from "../../utils/types"
import { hashString } from "../../utils/strings"


export default class LocationType extends SqlType {
  id: number
  seats: number
  type: string
  name: string

  static databaseName = "locations_types"

  static getEmptyObject() {
    return new LocationType()
  }

  constructor() {
    super()
    this.id = 0
    this.name = "Dev"
    this.type = "Dev"
    this.seats = 0
  }

  static computeId = (name: string, type: string, seats: number): IdOf<LocationType> => {
    let hash = hashString(name)
    hash = hash * 31 + hashString(type)
    hash = hash * 31 + seats
    hash = hash < 0 ? -hash : hash
    return hash
  }

  equals(other: LocationType): boolean {
    return this.id === other.id &&
      this.name === other.name &&
      this.type === other.type &&
      this.seats === other.seats
  }

  public fromJson(json: any): LocationType {
    this.id = json.id
    this.name = json.name
    this.type = json.type
    this.seats = json.seats
    return this
  }
}
