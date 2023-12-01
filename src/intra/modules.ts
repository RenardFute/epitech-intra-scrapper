import SourceUser, { Promo } from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import connector from "../sql/connector"
import dayjs from "dayjs"

enum ModuleFlags {
  REQUIRED = "Required Registration",
  MULTIPLE_REGISTRATION = "Multiple Registration",
  NONE = "None",
  PROGRESSIVE = "Progressive",
  ROADBLOCK = "Roadblock"
}

const knownFlagsIds: string[] = [
  "192",
  "96",
  "66",
  "160",
  "98",
  "136",
  "0",
  "32",
  "2",
  "200",
  "34"
]

const flagCombination: { [key: string]: ModuleFlags[] } = {
  "192": [ModuleFlags.REQUIRED],
  "96": [ModuleFlags.MULTIPLE_REGISTRATION],
  "66": [ModuleFlags.PROGRESSIVE],
  "2": [ModuleFlags.PROGRESSIVE],
  "160": [ModuleFlags.REQUIRED, ModuleFlags.MULTIPLE_REGISTRATION],
  "98": [ModuleFlags.MULTIPLE_REGISTRATION, ModuleFlags.PROGRESSIVE],
  "34": [ModuleFlags.MULTIPLE_REGISTRATION, ModuleFlags.PROGRESSIVE],
  "136": [ModuleFlags.REQUIRED, ModuleFlags.ROADBLOCK],
  "200": [ModuleFlags.REQUIRED, ModuleFlags.ROADBLOCK],
  "0": [ModuleFlags.NONE],
  "32": [ModuleFlags.MULTIPLE_REGISTRATION]
}

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

type moduleDTO = {
  id: number,
  title_cn: null | string,
  semester: number,
  num: string,
  begin: string,
  end: string,
  end_register: string | null,
  scolaryear: number,
  code: string,
  codeinstance: string,
  location_title: string,
  instance_location: string,
  flags: string,
  credits: string,
  rights: unknown[],
  status: "valid" | "ongoing" | "notregistered",
  waiting_grades: null,
  active_promo: "0" | "1",
  open: "0" | "1",
  title: string
}

export const fetchModulesForPromo = async (promo: Promo): Promise<Module[]> => {
  const user = await connector.getOne(SourceUser, { promo: promo, disabled: 0 })
  if (!user) {
    // TODO: Send error message with discord bot
    throw new Error("No user found")
  }
  const r = await fetch("https://intra.epitech.eu/course/filter?format=json", {
    headers: {
      "Cookie": "user="+user.cookie,
    }
  })

  const dto = await r.json() as moduleDTO[]
  const modules: Module[] = []
  for (const m of dto) {
    const module = await parseModule(m, user)
    if (module)
      modules.push(module)
  }
  return modules
}
