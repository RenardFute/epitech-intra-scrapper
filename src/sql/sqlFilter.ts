export type EasySqlFilter<T extends typeof SqlFilter> = {
  [P in keyof InstanceType<T>]?: InstanceType<T>[P];
}

export class SqlFilterField<T extends typeof SqlFilter> {
  public field: keyof T
  public value: any

  constructor(field: keyof T, value: any) {
    this.field = field
    this.value = value
  }
}

export enum SqlFilterOperator {
  OR = 'OR',
  AND = 'AND'
}

export default class SqlFilter<T extends typeof SqlFilter> {
  public left: SqlFilter<T> | SqlFilterField<T>
  public operator: SqlFilterOperator
  public right: SqlFilter<T> | SqlFilterField<T>
}

export class SqlFilterBuilder<T extends typeof SqlFilter> {
  public filter

  static as<T extends typeof SqlFilter>(data: EasySqlFilter<T>) {

  }
}
