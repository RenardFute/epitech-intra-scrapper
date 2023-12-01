import { Protocol } from "devtools-protocol"
import connector, { SqlBoolean, SqlType } from "../connector"
import { Page } from "puppeteer"
import { browser, getGDPRAcceptCookie, isLoginPage } from "../../intra/utils"
import { updateChannel } from "../../discord"
import Activity from "./activity"
import Module from "./module"

export enum Promo {
  TEK_1 = "TEK 1",
  TEK_2 = "TEK 2",
  TEK_3 = "TEK 3",
  TEK_4 = "TEK 4",
  TEK_5 = "TEK 5",
  PRE_MSC_1 = "PRE-MSC 1",
  PRE_MSC_2 = "PRE-MSC 2",
  MSC_1 = "MSC 1",
  MSC_2 = "MSC 2"
}

export default class SourceUser extends SqlType {
  name: string
  cookie: string
  year: number
  promo: Promo
  discordUserId: string
  disabled: SqlBoolean
  static databaseName = "source_users"

  static getEmptyObject() {
    return new SourceUser()
  }

  public constructor() {
    super()
    this.name = ""
    this.cookie = ""
    this.year = 0
    this.promo = Promo.TEK_1
    this.discordUserId = ""
    this.disabled = false
  }


  public buildConnectionCookie(): Protocol.Network.CookieParam {
    return {
      name: 'user',
      path: '/',
      domain: 'intra.epitech.eu',
      httpOnly: true,
      secure: true,
      value: this.cookie
    }
  }

  public toString(): string {
    return this.isDiscordBound() ? '<@' + this.discordUserId + '>' : this.name
  }

  public openPage(url: string): Promise<Page> {
    return openPageForUser(this, url)
  }

  public isDiscordBound(): boolean {
    return this.discordUserId.length > 1
  }

  public async isLogged(): Promise<boolean> {
    return !this.disabled && await isUserStillLoggedIn(this)
  }

  public async getActivityFromName(name: string): Promise<Activity | null> {
    const activities = await connector.getMany(Activity, { name: name })
    if (!activities) return null
    for (const activity of activities) {
      const module = await connector.getOne(Module, { id: activity.moduleId })
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
      this.discordUserId === other.discordUserId
  }

  public fromJson(json: any): SourceUser {
    this.name = json.name
    this.cookie = json.cookie
    this.year = json.year
    this.promo = json.promo
    this.discordUserId = json.discordUserId
    this.disabled = json.disabled
    return this
  }

  public getModules(): Promise<Module[]> {
    return connector.getMany(Module, { promo: this.promo })
  }
}

export const openPageForUser = async (user: SourceUser, url: string): Promise<Page> => {
  const b = await browser(user)
  const page = await b.newPage()
  await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie())
  await page.goto(url)
  await page.setViewport({ width: 1920, height: 1080 })
  return page
}

export const isUserStillLoggedIn = async (user: SourceUser): Promise<boolean> => {
  const b = await browser(user)
  const page = await b.newPage()
  await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie())
  await page.goto('https://intra.epitech.eu')
  await page.setViewport({ width: 1920, height: 1080 })
  const r: boolean = !await isLoginPage(page)
  if (!r) {
    user.disabled = true
    await connector.update(SourceUser, user, { discordUserId: user.discordUserId })
  } else {
    user.disabled = false
    await connector.update(SourceUser, user, { discordUserId: user.discordUserId })
  }
  await page.close()
  return r
}

export const getSyncedPromos = async (): Promise<Promo[]> => {
  const sourceUsers = await connector.getMany(SourceUser, { disabled: false })
  const promos = [] as Promo[]
  for (const user of sourceUsers) {
    const b = await browser(user)
    const page = await b.newPage()
    await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie())
    await page.goto("https://intra.epitech.eu")
    await page.setViewport({ width: 1920, height: 1080 })
    if (!await isLoginPage(page)) {
      promos.push(user.promo)
    } else if (!user.disabled) {
      updateChannel?.send(`${user} is not logged in anymore, please update your cookie.`)
      user.disabled = true
      await connector.update(SourceUser, user, { discordUserId: user.discordUserId })
    }
    await page.close()
  }
  return promos.filter((promo, index, self) => self.indexOf(promo) === index)
}
