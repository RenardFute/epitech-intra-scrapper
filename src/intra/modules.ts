import SourceUser, { Promo } from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import connector from "../sql/connector"
import dayjs from "dayjs"
import { moduleDTO, ModuleFlags, ModuleFlagsMasks } from "./dto"
import { fetchModulesForUser } from "./scrappers"
import ModuleFlag from "../sql/objects/moduleFlag"

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

  const result = new Module().fromJson({
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
  await connector.delete(ModuleFlag, { moduleId: result.id })
  const flagsToInsert = createFlags(flags, result)
  for (const flag of flagsToInsert) {
    if (flagsToInsert.length > 1 && flag.flag === ModuleFlags.NONE)
      continue
    await connector.insert(ModuleFlag, flag)
  }
  return result
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

export const scrapModulesForPromo = async (promo: Promo): Promise<Module[]> => {
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
