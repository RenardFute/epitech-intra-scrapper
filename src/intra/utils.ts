import puppeteer, { Browser, Page } from "puppeteer"
import { Promo } from "../sql/objects/sourceUser"
import { Protocol } from "devtools-protocol"

export const isLoginPage = async (page: Page): Promise<boolean> => {
  return (await page.$("#auth-login")) !== null;
}

let _browser: Browser | null = null;
export const browser = async (): Promise<Browser> => {
  if (_browser === null) {
    _browser = await puppeteer.launch({ headless: "new"});
  }
  return _browser;
}

export const getGDPRAcceptCookie = ():Protocol.Network.CookieParam => {
  return {
    name: 'gdpr',
    path: '/',
    domain: 'intra.epitech.eu',
    value: '1'
  }
}
