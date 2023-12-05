import SourceUser from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import Activity from "../sql/objects/activity"
import connector from "../sql/connector"
import { fetchModuleForUser } from "./scrappers"
import { activityDTO } from "./dto"
import dayjs from "dayjs"
import { isDev } from "../index"

const parseActivity = async (dto: activityDTO, module: Module): Promise<Activity> => {
  const name = dto.title
  const start = dayjs(dto.start, "YYYY-MM-DD HH:mm:ss").toDate()
  const begin = dayjs(dto.begin, "YYYY-MM-DD HH:mm:ss").toDate()
  const end = dayjs(dto.end, "YYYY-MM-DD HH:mm:ss").toDate()
  const endRegister = dto.end_register ? dayjs(dto.end_register, "YYYY-MM-DD HH:mm:ss").toDate() : null
  const deadline = dto.deadline ? dayjs(dto.deadline, "YYYY-MM-DD HH:mm:ss").toDate() : null
  const location = dto.instance_location
  const description = dto.description
  const url: string = module.url + dto.codeacti

  // Computed values
  const now = new Date()
  const isOngoing = now >= start && now < end

  return new Activity().fromJson({
    description,
    end,
    hasMeeting: dto.nb_planified && dto.nb_planified > 0,
    id: dto.codeacti,
    isGraded: dto.is_note,
    isOngoing,
    isProject: dto.is_projet,
    location,
    moduleId: module.id,
    name,
    start,
    url,
    begin,
    deadline,
    endRegister,
    type: dto.type_title,
    mainType: dto.type_code
  })
}

export const scrapActivitiesForModule = async (module: Module): Promise<Activity[]> => {
  const user = await connector.getOne(SourceUser, { promo: module.promo, disabled: 0 })
  if (!user) {
    if (isDev)
      console.error("No user found for module", module)
    return []
  }
  const dto = await fetchModuleForUser(user, module)
  if (!dto.activites)
    return []
  const activities: Activity[] = []
  for (const activityDTO of dto.activites) {
    const activity = await parseActivity(activityDTO, module)
    activities.push(activity)
  }
  return activities
}
