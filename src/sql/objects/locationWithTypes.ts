import { SqlType } from "../connector"
import { IdOf } from "../../utils/types"
import Location from "./location"
import LocationType from "./locationType"
export default class LocationWithTypes extends SqlType{
  locationId: IdOf<Location>
  locationTypeId: IdOf<LocationType>

  static databaseName = "locations_with_types"

  static getEmptyObject() {
    return new LocationWithTypes()
  }

  constructor() {
    super()
    this.locationId = ""
    this.locationTypeId = 0
  }

  equals(other: LocationWithTypes): boolean {
    return this.locationId === other.locationId &&
      this.locationTypeId === other.locationTypeId
  }

  public fromJson(json: any): LocationWithTypes {
    this.locationId = json.locationId
    this.locationTypeId = json.locationTypeId
    return this
  }
}
