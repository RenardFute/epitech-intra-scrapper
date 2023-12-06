import SqlType from "./sqlType"

export const tableKey = Symbol("Table")

export function Table<K extends typeof SqlType>(tableName: string) {
  return (target: K, propertyKey: string) => {
    Reflect.defineMetadata(target, tableKey, propertyKey)
  }
}
