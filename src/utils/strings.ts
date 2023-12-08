export const hashString = (str: string) => {
  const arr = str.split('')
  return arr.reduce(
    (hashCode, currentVal) =>
      (hashCode =
        currentVal.charCodeAt(0) +
        (hashCode << 6) +
        (hashCode << 16) -
        hashCode),
    0
  )
}

export const enum Case {
  CAMEL_CASE = 'camelCase',
  SNAKE_CASE = 'snake_case'
}

interface ConvertCaseOption {
  from: Case,
  to: Case
}

export const convertCase = (str: string, option: ConvertCaseOption): string => {
  if (option.from === option.to) {
    return str
  }
  if (option.to === Case.SNAKE_CASE) {
    switch (option.from) {
      case Case.CAMEL_CASE:
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
      default:
        return str
    }
  }
  if (option.to === Case.CAMEL_CASE) {
    switch (option.from) {
      case Case.SNAKE_CASE:
        return str.replace(/([a-z0-9])_([a-z])/g, (g) => g[0] + g[2].toUpperCase())
      default:
        return str
    }
  }
  return str
}

export const escapeSQL = (str: string): string => {
  let result = str
  // Escape all backslashes
  result = result.replace(/\\/g, "\\\\")

  // Escape all apostrophes
  result = result.replace(/'/g, "\\'")

  return result
}
