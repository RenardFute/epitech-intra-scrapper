import connector from "../connector"
import Activity from "./activity"
import Module from "./module"
import SqlType from "../sqlType"
import assert from "assert"
import { Column, Id, Table } from "../annotations"
import SqlFilter from "../sqlFilter"

/**
 * Enum representing the different promos
 * @enum {string}
 * @since 1.0.0
 * @category User
 * @author Axel ECKENBERG
 */
export enum Promo {
  TEK_1 = "TEK 1",
  TEK_2 = "TEK 2",
  TEK_3 = "TEK 3",
  TEK_4 = "TEK 4",
  TEK_5 = "TEK 5",
  PRE_MSC_1 = "PRE-MSC 1",
  PRE_MSC_2 = "PRE-MSC 2",
  MSC_1 = "MSC 1",
  MSC_2 = "MSC 2",
  TEKS = "TEKS"
}

/**
 * Class representing a source user
 * @extends SqlType
 * @category User
 * @since 1.0.0
 * @author Axel ECKENBERG
 * @see SqlType
 */
@Table('source_users')
export default class SourceUser extends SqlType {
  /**
   * The name of the user
   * @type {string}
   * @since 1.0.0
   * @category User
   * @see SourceUser
   * @fieldOf SourceUser
   * @instance
   * @default ""
   * @author Axel ECKENBERG
   */
  @Column()
  public name: string
  /**
   * The connection cookie of the user
   * @type {string}
   * @since 1.0.0
   * @category User
   * @see SourceUser
   * @fieldOf SourceUser
   * @instance
   * @default ""
   * @author Axel ECKENBERG
   */
  @Column()
  public cookie: string
  /**
   * The year the user arrived at Epitech in TEK 1
   * @type {number}
   * @since 1.0.0
   * @category User
   * @see SourceUser
   * @see Promo.TEK_1
   * @fieldOf SourceUser
   * @instance
   * @default 0
   * @author Axel ECKENBERG
   */
  @Column()
  public year: number
  /**
   * The promo of the user
   * @type {Promo}
   * @since 1.0.0
   * @category User
   * @see SourceUser
   * @fieldOf SourceUser
   * @instance
   * @default Promo.TEK_1
   * @see Promo
   * @see Promo.TEK_1
   * @author Axel ECKENBERG
   */
  @Column()
  public promo: Promo
  /**
   * The discord user id of the user
   * @type {string}
   * @since 1.0.0
   * @category User
   * @primaryKey
   * @see SourceUser
   * @fieldOf SourceUser
   * @instance
   * @default ""
   * @author Axel ECKENBERG
   */
  @Id()
  @Column()
  public id: string
  /**
   * Whether the user is disabled or not (e.g. not logged in anymore)
   * @type {SqlBoolean}
   * @since 1.0.0
   * @category User
   * @see SourceUser
   * @fieldOf SourceUser
   * @instance
   * @default false
   * @see SqlBoolean
   * @author Axel ECKENBERG
   */
  @Column()
  public disabled: boolean

  static getEmptyObject() {
    return new SourceUser()
  }

  public constructor() {
    super()
    this.name = ""
    this.cookie = ""
    this.year = 0
    this.promo = Promo.TEK_1
    this.id = ""
    this.disabled = false
  }

  public toString(): string {
    return this.isDiscordBound() ? '<@' + this.id + '>' : this.name
  }

  public isDiscordBound(): boolean {
    return this.id.length > 1
  }

  public async isLogged(): Promise<boolean> {
    return !this.disabled && await isUserStillLoggedIn(this)
  }

  public async getActivityFromName(name: string): Promise<Activity | null> {
    const activities = await connector.getMany(Activity, SqlFilter.from(Activity,{ name: name }))
    if (!activities) return null
    for (const activity of activities) {
      assert(typeof activity.module === 'number')
      const module = await connector.getOne(Module, SqlFilter.from(Module,{ id: activity.module }))
      if (!module) continue
      if (module.promo !== this.promo) continue
      return activity
    }
    return null
  }

  equals(other: SourceUser): boolean {
    return this.name === other.name &&
      this.cookie === other.cookie &&
      this.year === other.year &&
      this.promo === other.promo &&
      this.id === other.id
  }

  public fromJson(json: any): SourceUser {
    this.name = json.name
    this.cookie = json.cookie
    this.year = json.year
    this.promo = json.promo
    this.id = json.id
    this.disabled = json.disabled
    return this
  }

  public getModules(): Promise<Module[]> {
    return connector.getMany(Module, SqlFilter.from(Module,{ promo: this.promo }))
  }
}

export const isUserStillLoggedIn = async (user: SourceUser): Promise<boolean> => {
  const r = await fetch('https://intra.epitech.eu?format=json', {
    headers: {
      'Cookie': 'user=' + user.cookie
    }
  })
  const json = await r.json() as any
  const isLoggedOut = 'message' in json && json.message === 'Veuillez vous connecter'
  if (isLoggedOut) {
    user.disabled = true
    await connector.update(SourceUser, user, SqlFilter.from(SourceUser,{ id: user.id }))
  } else {
    user.disabled = false
    await connector.update(SourceUser, user, SqlFilter.from(SourceUser,{ id: user.id }))
  }
  return !isLoggedOut
}

export const getSyncedPromos = async (): Promise<Promo[]> => {
  const sourceUsers = await connector.getMany(SourceUser)
  const promos = [] as Promo[]
  for (const user of sourceUsers) {
    const isLogged = await isUserStillLoggedIn(user)
    if (isLogged) {
      promos.push(user.promo)
    } else {
      user.disabled = true
      await connector.update(SourceUser, user, SqlFilter.from(SourceUser,{ id: user.id }))
    }
  }
  return promos.filter((promo, index, self) => self.indexOf(promo) === index)
}
