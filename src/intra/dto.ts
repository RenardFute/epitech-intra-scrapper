import * as t from 'io-ts'

export enum ModuleFlags {
  REQUIRED = "Required Registration",
  MULTIPLE_REGISTRATION = "Multiple Registration",
  NONE = "None",
  PROGRESSIVE = "Progressive",
  ROADBLOCK = "Roadblock"
}

export const Grades = t.union([
  t.literal("Acquis"),
  t.literal("A"),
  t.literal("B"),
  t.literal("C"),
  t.literal("D"),
  t.literal("E"),
  t.literal("F"),
  t.literal("N/A"),
])

export const knownFlagsIds: string[] = [
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

export const flagCombination: { [key: string]: ModuleFlags[] } = {
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

export const booleanCodec = t.union([t.literal("0"), t.literal("1"), t.literal(1), t.literal(0), t.boolean])
export const moduleCodec = t.type({
  id: t.number,
  title_cn: t.union([t.string, t.null]),
  semester: t.number,
  num: t.string,
  begin: t.string,
  end: t.string,
  end_register: t.union([t.string, t.null]),
  scolaryear: t.number,
  code: t.string,
  codeinstance: t.string,
  location_title: t.string,
  instance_location: t.string,
  flags: t.string,
  credits: t.string,
  rights: t.array(t.unknown),
  status: t.union([t.literal("valid"), t.literal("ongoing"), t.literal("notregistered")]),
  waiting_grades: t.null,
  active_promo: booleanCodec,
  open: booleanCodec,
  title: t.string
})

export const UserTypes = t.union([
  t.literal("user"),
  t.literal("group")
])

export const ManagerStatus = t.union([
  t.literal("accept"),
  t.literal("eat"),
  t.literal("refused"),
  t.literal("present")
])

export const partialUserCodec = t.partial({
  type: UserTypes,
  manager_status: ManagerStatus
})

export const userCodec = t.intersection([t.type({
  login: t.string,
  title: t.string,
  picture: t.union([t.string, t.null]),
}), partialUserCodec])

export const ActivityTypeCodec = t.union([
  t.literal("Review"),
  t.literal("Defense"),
  t.literal("Follow-up"),
  t.literal("Bootstrap"),
  t.literal("Project"),
  t.literal("Kick-off"),
  t.literal("TEPitech"),
  t.literal("DIAGTEST"),
  t.literal("Workshop"),
  t.literal("TD"),
  t.literal("TP"),
  t.literal("Conference"),
  t.literal("Accompagnement"),
  t.literal("Experience"),
  t.literal("Hackathon"),
  t.literal("Talk"),
  t.literal("Meetup"),
  t.literal("Pitch"),
  t.literal("Mini-project"),
  t.literal("Course"),
  t.literal("Rush"),
  t.literal("Stumper"),
  t.literal("BTTF"),
  t.literal("Coaching"),
  t.literal("Event"),
  t.literal("Coding Club"),
  t.literal("Short Coding Club"),
  t.literal("Camp"),
  t.literal("MCQ"),
  t.literal("Delivery"),
  t.literal("Corrections"),
  t.literal("Project time"),
  t.literal("Keynote"),
  t.literal("CUS - Algorithms"),
  t.literal("CUS - AI"),
  t.literal("Formation"),
])

export const ActivityMainTypeCodec = t.union([
  t.literal("rdv"),
  t.literal("tp"),
  t.literal("proj"),
  t.literal("class"),
  t.literal("exam"),
  t.literal("other"),
])

export const openCloseCodec = t.union([t.literal("open"), t.literal("close")])
export const userStatusCodec = t.union([t.literal("present"), t.literal("absent"), t.literal("N/A")])

export const projectCodec = t.type({
  id: t.number,
  scolaryear: t.string,
  codemodule: t.string,
  codeinstance: t.string,
  title: t.string
})

export const eventCodec = t.type({
  code: t.string,
  num_event: t.string,
  seats: t.union([t.string, t.null]),
  title: t.union([t.string, t.null]),
  description: t.union([t.string, t.null]),
  nb_inscrits: t.string,
  begin: t.string,
  end: t.string,
  id_activite: t.string,
  location: t.union([t.string, t.null]),
  nb_max_students_projet: t.union([t.string, t.null]),
  already_register: t.union([t.string, t.null]),
  user_status: t.union([userStatusCodec, t.null]),
  allow_token: booleanCodec,
  assistants: t.array(userCodec),
})

export const activityCodec = t.type({
  codeacti: t.string,
  call_ihk: t.union([booleanCodec, t.null]),
  slug: t.union([t.string, t.null]),
  instance_location: t.string,
  module_title: t.string,
  title: t.string,
  description: t.string,
  type_title: ActivityTypeCodec,
  type_code: ActivityMainTypeCodec,
  begin: t.string,
  start: t.string,
  end_register: t.union([t.string, t.null]),
  deadline: t.union([t.string, t.null]),
  end: t.string,
  nb_hours: t.union([t.string, t.null]),
  nb_group: t.number,
  num: t.number,
  register: booleanCodec,
  register_by_bloc: booleanCodec,
  register_prof: booleanCodec,
  title_location_type: t.union([t.string, t.null]),
  is_projet: t.boolean,
  id_projet: t.union([t.string, t.null]),
  project_title: t.union([t.string, t.null]),
  is_note: t.boolean,
  nb_notes: t.union([t.number, t.null]),
  is_blocins: t.boolean,
  rdv_status: openCloseCodec,
  id_bareme: t.union([t.string, t.null]),
  title_bareme: t.union([t.string, t.null]),
  archive: booleanCodec,
  hash_elearning: t.union([t.string, t.null]),
  ged_node_adm: t.union([t.string, t.null]),
  nb_planified: t.union([t.number, t.null]),
  hidden: t.boolean,
  project: t.union([projectCodec, t.null]),
  events: t.array(eventCodec),
})

export const detailedModuleCodec = t.type({
  scolaryear: t.string,
  codemodule: t.string,
  codeinstance: t.string,
  semester: t.number,
  scolaryear_template: t.string,
  title: t.string,
  begin: t.string,
  end_register: t.union([t.string, t.null]),
  end: t.string,
  past: booleanCodec,
  closed: booleanCodec,
  opened: booleanCodec,
  user_credits: t.union([t.string, t.null]),
  credits: t.number,
  description: t.string,
  competence: t.union([t.string, t.null]),
  flags: t.string,
  instance_flags: t.string,
  max_ins: t.null,
  instance_location: t.string,
  hidden: booleanCodec,
  old_acl_backup: t.null,
  resp: t.array(userCodec),
  assistant: t.array(userCodec),
  rights: t.union([t.array(t.unknown), t.null]),
  template_resp: t.array(userCodec),
  allow_register: t.union([booleanCodec, t.null]),
  date_ins: t.union([t.string, t.null]),
  student_registered: t.number,
  student_grade: t.union([Grades, t.null]),
  student_credits: t.number,
  color: t.union([t.string, t.null]),
  student_flags: t.union([t.string, t.null]),
  current_resp: t.boolean,
  activites: t.array(activityCodec),
})

export const RoomsCodec = t.union([
    t.literal("Comté"),
    t.literal("Mordor"),
    t.literal("Torvalds"),
    t.literal("Gallifrey"),
    t.literal("Bourg Palette"),
    t.literal("Gotham"),
    t.literal("Hub Innovation"),
    t.literal("Poudlard"),
    t.literal("Tatooine"),
    t.literal("Vogons"),
    t.literal("Westeros"),
    t.literal("Kamar-Taj"),
    t.literal("Accueil"),
    t.literal("Barney Stinson"),
    t.literal("Cafétéria"),
    t.literal("Foyer"),
    t.literal("Hall"),
    t.literal("Marty McFly"),
    t.literal("Nether"),
    t.literal("Petit Bureau Pédagogie"),
    t.literal("Visio Teams"),
    t.literal("Salle 105"),
    t.literal("Salle 106"),
    t.literal("Salle 111"),
    t.literal("Salle 111-A"),
    t.literal("Salle 111-B"),
    t.literal("Salle 112"),
    t.literal("Salle 112-A"),
    t.literal("Salle 112-B"),
    t.literal("Salle 114"),
    t.literal("Salle 115"),
    t.literal("Amphithéâtre"),
    t.literal("Salle 20"),
    t.literal("Salle L1 à L8"),
    t.literal("Extérieur"),
    t.literal("Cité des Congrès"),
    t.literal("La Cantine - Hall 6"),
    t.literal("Le Palace - Place Graslin"),
    t.literal("Valeuriad - 14 rue François Evellin")
])

export const RoomCodex = t.type({
  name: t.string,
  hide_if_free: t.boolean,
  rooms: t.record(RoomsCodec, t.type({
      activities: t.array(t.type({
        activity_title: t.string,
        start_at: t.number,
        end_at: t.number,
        oros_tags: t.array(t.unknown),
        type: t.union([ActivityMainTypeCodec, t.undefined]),
      })),
      force_closed: t.union([t.boolean, t.undefined]),
      force_closed_message:  t.union([t.string, t.undefined]),
      french_gender: t.union([t.union([t.literal('masculine'), t.literal('feminine')]), t.undefined])
    })
  )
})

export type detailedModuleDTO = t.TypeOf<typeof detailedModuleCodec>
export type userDTO = t.TypeOf<typeof userCodec>
export type activityDTO = t.TypeOf<typeof activityCodec>
export type eventDTO = t.TypeOf<typeof eventCodec>
export type projectDTO = t.TypeOf<typeof projectCodec>
export type moduleDTO = t.TypeOf<typeof moduleCodec>
export type ActivityType = t.TypeOf<typeof ActivityTypeCodec>
export type ActivityMainType = t.TypeOf<typeof ActivityMainTypeCodec>
export type RoomDTO = t.TypeOf<typeof RoomCodex>
export type Rooms = t.TypeOf<typeof RoomsCodec>
