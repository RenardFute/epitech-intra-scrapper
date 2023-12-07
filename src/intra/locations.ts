import { fetchLocations } from "./scrappers"
import Location from "../sql/objects/location"
import LocationType from "../sql/objects/locationType"

export const scrapLocations = async (): Promise<Location[]> => {
  const locations = await fetchLocations()
  if (!locations) {
    return []
  }
  const result: Location[] = []
  for (const key in locations) {
    const locationDTO = locations[key]
    const location = new Location().fromJson({
      id: key,
      name: locationDTO.title,
      floor: locationDTO.floor,
      disabled: locationDTO.disabled,
      types: locationDTO.types?.map((type) => {
        return new LocationType().fromJson({
          id: LocationType.computeId(type.title, type.type, type.seats),
          name: type.title,
          type: type.type,
          seats: type.seats,
        })
      })
    })
    result.push(location)
  }
  return result
}
