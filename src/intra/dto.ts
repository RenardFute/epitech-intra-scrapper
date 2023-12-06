import * as t from 'io-ts'


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

export enum ModuleFlags {
  REQUIRED = "Required Registration",
  MULTIPLE_REGISTRATION = "Multiple Registration",
  NONE = "None",
  PROGRESSIVE = "Progressive",
  ROADBLOCK = "Roadblock",
  OPTIONAL = "Optional",
  HIDDEN_1 = "Hidden 1",
  HIDDEN_2 = "Hidden 2",
  ACQUIRED_OR_NOT = "Acquired or not",
}

export const ModuleFlagsMasks: { [key in ModuleFlags]: number } = {
  [ModuleFlags.REQUIRED]:               0b10000000,
  [ModuleFlags.ACQUIRED_OR_NOT]:        0b01000000,
  [ModuleFlags.MULTIPLE_REGISTRATION]:  0b00100000,
  [ModuleFlags.HIDDEN_2]:               0b00010000,
  [ModuleFlags.ROADBLOCK]:              0b00001000,
  [ModuleFlags.HIDDEN_1]:               0b00000100,
  [ModuleFlags.PROGRESSIVE]:            0b00000010,
  [ModuleFlags.OPTIONAL]:               0b00000001,
  [ModuleFlags.NONE]:                   0b00000000,
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
  // Flags is a bitfield as a string, but it should not be longer than 8 bits
  flags: t.brand(t.string, (s): s is t.Branded<string, { readonly Flags: unique symbol }> => s.length <= 8, "Flags"),
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

// @ts-ignore
export const projectStatusCodec = t.union([
  t.literal("project_confirmed")
])

export const groupUserCodec = t.intersection([userCodec, t.type({
  status: t.union([t.literal("confirmed"), t.literal("requesting")]),
  date_ins: t.string,
  date_modif: t.union([t.null, t.string]),
})])

export const projectGroupCodec = t.type({
  id: t.string,
  title: t.union([t.string, t.null]),
  code: t.string,
  final_note: t.null,
  repository: t.union([t.string, t.null]),
  closed: t.boolean,
  master: groupUserCodec,
  members: t.array(groupUserCodec),
})

export const detailedProjectCodec = t.type({
  scolaryear: t.string,
  codemodule: t.string,
  codeinstance: t.string,
  codeacti: t.string,
  instance_location: t.string,
  module_title: t.string,
  id_activite: t.string,
  project_title: t.string,
  type_title: ActivityTypeCodec,
  type_code: ActivityMainTypeCodec,
  register: booleanCodec,
  register_by_bloc: booleanCodec,
  register_prof: booleanCodec,
  nb_min: t.number,
  nb_max: t.number,
  begin: t.string,
  end: t.string,
  end_register: t.union([t.string, t.null]),
  deadline: t.union([t.string, t.null]),
  is_rdv: booleanCodec,
  instance_allowed: t.union([t.string, t.null]),
  title: t.string,
  description: t.string,
  closed: booleanCodec,
  over: t.number,
  over_deadline: t.union([t.number, t.null]),
  date_access: booleanCodec,
  instance_registered: booleanCodec,
  user_project_status: t.union([projectStatusCodec, t.null]),
  root_slug: t.union([t.string, t.null]),
  forum_path: t.union([t.string, t.null]),
  slug: t.union([t.string, t.null]),
  call_ihk: t.union([booleanCodec, t.null]),
  nb_notes: t.union([t.null, t.number]),
  user_project_master: t.union([booleanCodec, t.null]),
  user_project_code: t.union([t.string, t.null]),
  user_project_title: t.union([t.string, t.null]),
  registered_instance: t.number,
  registered: t.array(projectGroupCodec),
  notregistered: t.array(userCodec),
  urls: t.array(t.type({
    notation: booleanCodec,
    title: t.string,
    link: t.string,
  }))
})

export const LocationTypeCodec = t.type({
  seats: t.number,
  type: t.string,
  title: t.string,
})

export const LocationCodec = t.type({
  title: t.string,
  disabled: t.union([t.boolean, t.undefined]),
  floor: t.union([t.number, t.undefined]),
  types: t.union([t.array(LocationTypeCodec), t.undefined]),
})

export type detailedModuleDTO = t.TypeOf<typeof detailedModuleCodec>
export type userDTO = t.TypeOf<typeof userCodec>
export type activityDTO = t.TypeOf<typeof activityCodec>
export type eventDTO = t.TypeOf<typeof eventCodec>
export type projectDTO = t.TypeOf<typeof projectCodec>
export type moduleDTO = t.TypeOf<typeof moduleCodec>
export type ActivityType = t.TypeOf<typeof ActivityTypeCodec>
export type ActivityMainType = t.TypeOf<typeof ActivityMainTypeCodec>
export type projectGroupDTO = t.TypeOf<typeof projectGroupCodec>
export type detailedProjectDTO = t.TypeOf<typeof detailedProjectCodec>
export type LocationTypeDTO = t.TypeOf<typeof LocationTypeCodec>
export type LocationDTO = t.TypeOf<typeof LocationCodec>
