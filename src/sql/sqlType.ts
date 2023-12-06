/**
 * A class to represent a type in the database
 * @class
 * @property {string} databaseName The name of the table in the database
 * @property {() => SqlType} getEmptyObject A function that returns an empty object of the type
 * @abstract
 * @category SQL
 * @since 1.0.0
 */
export default abstract class SqlType {
  static getEmptyObject: () => SqlType

  protected constructor(databaseName: string) {
    this.databaseName = databaseName
  }

  /**
   * Check if two objects are equal
   * @param other - The object to compare to
   * @returns {boolean} True if the objects are equal, false otherwise
   * @category SQL
   * @since 1.0.0
   * @method
   * @public
   * @abstract
   * @author Axel ECKENBERG
   */
  abstract equals(other: SqlType): boolean

  /**
   * Convert an object to JSON
   * @param json - The JSON representation of the object
   * @returns {SqlType} The object
   * @category SQL
   * @since 1.0.0
   * @method
   * @public
   * @abstract
   * @author Axel ECKENBERG
   */
  abstract fromJson(json: any): SqlType

  static toTable<K extends SqlType>(object: K): string {

    return ""
  }
}
