import SourceUser, { Promo } from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import connector from "../sql/connector"
import dayjs from "dayjs"
import { flagCombination, knownFlagsIds, moduleDTO, ModuleFlags } from "./dto"
import { fetchModulesForUser } from "./scrappers"

const parseModule = async (dto: moduleDTO, source: SourceUser): Promise<Module | null> => {
  const nameFull = dto.title
  const name = nameFull.substring(nameFull.indexOf("-") + 1).replace('Roadblock -', '').trim()
  const semester = dto.semester
  const code = dto.code
  const start = dayjs(dto.begin, "YYYY-MM-DD").toDate()
  const endRegistration = dto.end_register ? dayjs(dto.end_register, "YYYY-MM-DD").toDate() : null
  const end = dayjs(dto.end, "YYYY-MM-DD").toDate()
  const city = dto.location_title
  const credits = parseInt(dto.credits)
  if (knownFlagsIds.indexOf(dto.flags) === -1) {
    console.log("Unknown flag id: " + dto.flags, dto)
    return null
  }
  const flags = flagCombination[dto.flags]
  const registrationStatus = dto.open === "1"
  const year = dto.scolaryear
  const url = "https://intra.epitech.eu/module/" + year + "/" + code + "/"+ dto.codeinstance + "/"
  const id = dto.id

  return new Module().fromJson({
    city,
    credits,
    end,
    endRegistration,
    id,
    isOngoing: dto.active_promo === "1",
    isRegistrationOpen: registrationStatus,
    isRoadblock: flags.indexOf(ModuleFlags.ROADBLOCK) > -1,
    isMandatory: flags.indexOf(ModuleFlags.REQUIRED) > -1,
    promo: source.promo,
    start,
    year,
    code,
    nameFull,
    name,
    semester,
    url
  })
}

export const fetchModulesForPromo = async (promo: Promo): Promise<Module[]> => {
  const user = await connector.getOne(SourceUser, { promo: promo, disabled: 0 })
  if (!user) {
    // TODO: Send error message with discord bot
    throw new Error("No user found")
  }
  const dto = await fetchModulesForUser(user)
  const modules: Module[] = []
  for (const m of dto) {
    const module = await parseModule(m, user)
    if (module)
      modules.push(module)
  }
  return modules
}
