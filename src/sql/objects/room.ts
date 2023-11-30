import { IdOf } from "../../utils/types"
import Activity from "./activity"
import { SqlType } from "../connector"
import dayjs from "dayjs"

export enum Rooms {
  COMTE = "Comté",
  MORDOR = "Mordor",
  TORVALDS = "Torvalds",
  GALLIFREY = "Gallifrey",
  BOURG_PALETTE = "Bourg Palette",
  GOTHAM = "Gotham",
  HUB_INNOVATION = "Hub Innovation",
  POUDLARD = "Poudlard",
  TATOOINE = "Tatooine",
  VOGONS = "Vogons",
  WESTEROS = "Westeros",
  KAMAR_TAJ = "Kamar-Taj",
  ACCUEIL = "Accueil",
  BARNEY_STINSON = "Barney Stinson",
  CAFETERIA = "Cafétéria",
  FOYER = "Foyer",
  HALL = "Hall",
  MARTY_MCFLY = "Marty McFly",
  NETHER = "Nether",
  PETIT_BUREAU_PEDAGOGIE = "Petit Bureau Pédagogie",
  VISIO_TEAMS = "Visio Teams",
  ROOM_105 = "Salle 105",
  ROOM_106 = "Salle 106",
  ROOM_111 = "Salle 111",
  ROOM_111_A = "Salle 111-A",
  ROOM_111_B = "Salle 111-B",
  ROOM_112 = "Salle 112",
  ROOM_112_A = "Salle 112-A",
  ROOM_112_B = "Salle 112-B",
  ROOM_114 = "Salle 114",
  ROOM_115 = "Salle 115",
  AMPHI = "Amphithéâtre",
  ROOM_20 = "Salle 20",
  ROOM_L1_L8 = "Salle L1 à L8",
  EXTERIEUR = "Extérieur",
  CITE_DES_CONGRES = "Cité des Congrès",
  LA_CANTINE = "La Cantine - Hall 6",
  LE_PALACE = "Le Palace - Place Graslin",
  VALEURIAD = "Valeuriad - 14 rue François Evellin"
}

export default class Room extends SqlType{
  id: number
  activityId: IdOf<Activity>
  start: Date
  end: Date
  room: Rooms
  sessionIndex: number

  static databaseName = "rooms"

  static getEmptyObject() {
    return new Room()
  }

  constructor() {
    super()
    this.id = 0
    this.activityId = 0
    this.start = new Date()
    this.end = new Date()
    this.room = Rooms.ACCUEIL
    this.sessionIndex = 0
  }

  static computeId = (activityId: number, index: number) => {
    let computedId = index * 31 + activityId
    computedId = computedId > 0 ? computedId : -computedId
    return computedId
  }

  public startToString(): string {
    return dayjs(this.start).utc().tz('Europe/Paris').format("HH[h]mm")
  }

  public endToString(): string {
    return dayjs(this.end).utc().tz('Europe/Paris').format("HH[h]mm")
  }

  equals(other: Room): boolean {
    return this.id === other.id &&
      this.activityId === other.activityId &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime() &&
      this.room === other.room &&
      this.sessionIndex === other.sessionIndex
  }

  public fromJson(json: any): Room {
    this.id = json.id
    this.activityId = json.activityId
    this.start = new Date(json.start)
    this.end = new Date(json.end)
    this.room = json.room
    this.sessionIndex = json.sessionIndex
    return this
  }
}
