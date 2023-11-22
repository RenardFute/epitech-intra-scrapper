import puppeteer, { Browser, ElementHandle, NodeFor, Page } from "puppeteer"
import { Protocol } from "devtools-protocol"
import customParseFormat from "dayjs/plugin/customParseFormat"
import updateLocale from "dayjs/plugin/updateLocale"
import dayjs from "dayjs"

require('dayjs/locale/fr')
dayjs.extend(customParseFormat)
dayjs.extend(updateLocale)
dayjs.updateLocale('fr', {
  monthsShort: [
    "jan", "fev", "mar", "avr", "mai", "juin",
    "jui", "aout", "sept", "oct", "nov", "déc"
  ]
})

export const isLoginPage = async (page: Page): Promise<boolean> => {
  return (await page.$("#auth-login")) !== null
}

let _browser: Browser | null = null
export const browser = async (): Promise<Browser> => {
  if (_browser === null) {
    _browser = await puppeteer.launch({ headless: "new", args: ['--lang=en-US,en']})
  }
  return _browser
}

export const getGDPRAcceptCookie = ():Protocol.Network.CookieParam => {
  return {
    name: 'gdpr',
    path: '/',
    domain: 'intra.epitech.eu',
    value: '1'
  }
}

export const getTextContentOrNA = async (element: ElementHandle | null): Promise<string> => {
  let result: string | null | undefined = null
  if (element) {
    result = await element.evaluate((el) => el.textContent)
  }
  return result ?? "N/A"
}

export const exportTextContentOrNA = async <Selector extends string>(element: ElementHandle<NodeFor<Selector>>, selector: Selector): Promise<string> => {
  const el = await element.$(selector)
  return await getTextContentOrNA(el)
}

export const exportDateContentOrNA = async <Selector extends string>(element: ElementHandle<NodeFor<Selector>>, selector: Selector, format?: string, includeYearIfNotPresent?: boolean): Promise<Date> => {
  const el = await element.$(selector)
  const text = await getTextContentOrNA(el)
  return parseDateOrNA(text, format, includeYearIfNotPresent)
}

export const parseDateOrNA = (text: string, format?: string, includeYearIfNotPresent?: boolean): Date => {
  const hasYearRegex = /.*\d{4}$/
  if (!hasYearRegex.test(text) && includeYearIfNotPresent) {
    text += " " + new Date().getFullYear()
  }
  dayjs.locale('fr')
  return dayjs(text, format, "fr").toDate()
}

export const exportNumberContentOrNA = async <Selector extends string>(element: ElementHandle<NodeFor<Selector>>, selector: Selector): Promise<number> => {
  const el = await element.$(selector)
  const text = await getTextContentOrNA(el)
  return parseInt(text)
}

export const cityMapping: { [key: string]: string } = {
  'France': 'FR',
  'Nantes': 'NAN'
}
