import { Protocol } from "devtools-protocol"
import connector, { SqlType } from "../connector"
import { Page } from "puppeteer"
import { browser, getGDPRAcceptCookie, isLoginPage } from "../../intra/utils"
import { updateChannel } from "../../discord"

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
  static databaseName = "source_users"

  public constructor() {
    super()
    this.name = ""
    this.cookie = ""
    this.year = 0
    this.promo = Promo.TEK_1
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
}

export const openPageForPromo = async (promo: Promo, url: string): Promise<{ page: Page, user: SourceUser }> => {
  const b = await browser()
  const page = await b.newPage()
  const user = await connector.getOne(SourceUser, { promo: promo })
  if (user === null) {
    throw new Error("User not found")
  }
  await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie())
  await page.goto(url)
  await page.setViewport({ width: 1920, height: 1080 })
  return {page, user}
}

export const isUserStillLoggedIn = async (user: SourceUser): Promise<boolean> => {
  const b = await browser()
  const page = await b.newPage()
  await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie())
  await page.goto('https://intra.epitech.eu')
  await page.setViewport({ width: 1920, height: 1080 })
  return !await isLoginPage(page)
}

export const getSyncedPromos = async (): Promise<Promo[]> => {
  const sourceUsers = await connector.getMany(SourceUser)
  const promos = [] as Promo[]
  for (const user of sourceUsers) {
    const b = await browser()
    const page = await b.newPage()
    await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie())
    await page.goto("https://intra.epitech.eu")
    await page.setViewport({ width: 1920, height: 1080 })
    if (!await isLoginPage(page)) {
      promos.push(user.promo)
    } else {
      updateChannel?.send(`The user ${user.name} is not logged in anymore, please update his cookie.`)
      connector.delete(SourceUser, { name: user.name }).then()
    }
    await page.close()
  }
  return promos.filter((promo, index, self) => self.indexOf(promo) === index)
}
