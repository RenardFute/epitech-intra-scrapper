import { Protocol } from "devtools-protocol"
import connector, { SqlType } from "../connector"
import { Page } from "puppeteer"
import { browser, getGDPRAcceptCookie } from "../../intra/utils"

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
  name: string;
  cookie: string;
  year: number;
  promo: Promo;
  static databaseName = "source_users";

  public constructor() {
    super();
    this.name = "";
    this.cookie = "";
    this.year = 0;
    this.promo = Promo.TEK_1;
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

export const openPageForPromo = async (promo: Promo, url: string): Promise<Page> => {
  const b = await browser();
  const page = await b.newPage();
  const user = await connector.getOne(SourceUser, { promo: promo });
  await page.setCookie(getGDPRAcceptCookie(), user.buildConnectionCookie());
  await page.goto(url);
  await page.setViewport({ width: 1920, height: 1080 });
  return page;
}
