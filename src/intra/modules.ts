import SourceUser, { Promo } from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import connector from "../sql/connector"
import dayjs from "dayjs"
import { moduleDTO, ModuleFlags, ModuleFlagsMasks } from "./dto"
import { fetchModulesForUser } from "./scrappers"
import ModuleFlag from "../sql/objects/moduleFlag"
import SqlFilter from "../sql/sqlFilter"

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
  const flags = findFlags(parseInt(dto.flags))
  const registrationStatus = dto.open === "1"
  const year = dto.scolaryear
  const url = "https://intra.epitech.eu/module/" + year + "/" + code + "/"+ dto.codeinstance + "/"
  const id = dto.id

  let promo = source.promo
  if (semester === 0) {
    promo = Promo.TEKS
  }

  return new Module().fromJson({
    city,
    credits,
    end,
    endRegistration,
    id,
    isOngoing: start.getTime() < Date.now() && end.getTime() > Date.now(),
    isRegistrationOpen: registrationStatus,
    isRoadblock: flags.indexOf(ModuleFlags.ROADBLOCK) > -1,
    isMandatory: flags.indexOf(ModuleFlags.REQUIRED) > -1,
    promo,
    start,
    year,
    code,
    nameFull,
    name,
    semester,
    url
  })
}

export const createFlags = (flags: ModuleFlags[], module: Module): ModuleFlag[] => {
  const result: ModuleFlag[] = []
  for (const flag of flags) {
    const moduleFlag = new ModuleFlag().fromJson({
      moduleId: module.id,
      flag: flag
    })
    result.push(moduleFlag)
  }
  return result
}

export const findFlags = (flags: number): ModuleFlags[] => {
  const result: ModuleFlags[] = []
  for (const flag in ModuleFlags) {
    const flagValue: ModuleFlags = ModuleFlags[flag as keyof typeof ModuleFlags]
    const flagMask = ModuleFlagsMasks[flagValue]
    if ((flags & flagMask) === flagMask) {
      result.push(flagValue)
    }
  }
  return result
}

export const scrapModulesForPromo = async (promo: Promo): Promise<{ module: Module, flags: number }[]> => {
  const user = await connector.getOne(SourceUser, SqlFilter.from(SourceUser,{ promo: promo, disabled: false }))
  if (!user) {
    console.error("No user found for promo", promo)
    return []
  }
  const dto = await fetchModulesForUser(user)
  const modules: { module: Module, flags: number }[] = []
  for (const m of dto) {
    const module = await parseModule(m, user)
    if (module)
      modules.push({module, flags: parseInt(m.flags)})
  }
  return modules
}
