import { fetchLocations } from "./scrappers"
import Location from "../sql/objects/location"
import LocationType from "../sql/objects/locationType"

export type LocationWithTypes = {
  location: Location
  types: LocationType[]
}

export const scrapLocations = async (): Promise<LocationWithTypes[]> => {
  const locations = await fetchLocations()
  if (!locations) {
    return []
  }
  const result: LocationWithTypes[] = []
  for (const key in locations) {
    const location = locations[key]
    const loc = new Location().fromJson({
      id: key,
      name: location.title,
      floor: location.floor,
      disabled: location.disabled,
    })
    const types = location.types?.map((type) => {
      return new LocationType().fromJson({
        id: LocationType.computeId(type.title, type.type, type.seats),
        name: type.title,
        type: type.type,
        seats: type.seats,
      })
    }) ?? []
    result.push({ location: loc, types })
  }
  return result
}
