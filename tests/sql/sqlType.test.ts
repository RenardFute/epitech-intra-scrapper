import SqlType from "../../src/sql/sqlType"
import { Column, Table } from "../../src/sql/annotations"
import { SqlTypes } from "../../src/sql/types"
import Activity from "../../src/sql/objects/activity"
import Module from "../../src/sql/objects/module"
import Location from "../../src/sql/objects/location"
import dayjs from "dayjs"
import connector from "../../src/sql/connector"
import assert from "node:assert"
import { IdOf } from "../../src/utils/types"
import { ModuleFlags } from "../../src/intra/dto"
import ModuleFlag from "../../src/sql/objects/moduleFlag"
import SqlFilter from "../../src/sql/sqlFilter"

@Table('test')
class TestSQlType extends SqlType {
  @Column()
  public id: string
  @Column()
  public n: number
  @Column()
  public b: boolean
  @Column('date', SqlTypes.DATE)
  public date: Date
  @Column('is_null', SqlTypes.STRING, true)
  public isNull: string | null
  @Column('name_changed')
  public oldName: string
  public notInDB: string

  public constructor() {
    super()
    this.id = 'ID'
    this.n = 32
    this.b = false
    this.date = dayjs('2003-07-20').toDate()
    this.isNull = null
    this.oldName = 'tests'
    this.notInDB = 'hidden'
  }

  equals(_other: SqlType): boolean {
    return false
  }

  fromJson(_json: any): SqlType {
    return this
  }

}

test('Get Table name from SqlType', async () => {
  const staticName = TestSQlType.getTableName()
  const name = new TestSQlType().getTableName()

  expect(name).toBe("test")
  expect(staticName).toBe("test")
})

test('Format SqlType to SQL Format', async () => {
  const test = new TestSQlType()
  const sqlFormat = test.toSQLReady()
  expect(sqlFormat).toBe(`id = 'ID', n = 32, b = FALSE, date = '${dayjs('2003-07-20').toDate().toISOString().slice(0, 19).replace('T', ' ')}', is_null = NULL, name_changed = 'tests'`)
})

test('From SQL to Activity', async () => {
  const id: IdOf<Activity> = 'acti-555210'
  const activity = await connector.getOne(Activity, SqlFilter.from(Activity, {id}))

  expect(activity).toBeInstanceOf(Activity)
  expect(activity.id).toBe(id)
  expect(activity.module).toBe(40639)
  expect(activity.name).toBe('C in 29 minutes')
  expect(activity.isOngoing).toBe(false)
  expect(activity.start.getTime()).toBe(dayjs('2022-09-26 00:00:00').toDate().getTime())
  expect(activity.end.getTime()).toBe(dayjs('2022-10-02 00:00:00').toDate().getTime())
  expect(activity.location).toBe('FR/NAN')
  expect(activity.description).toBe('Learning C-programming is fast - here\'s the proof!')
  expect(activity.isProject).toBe(false)
  expect(activity.isGraded).toBe(false)
  expect(activity.hasMeeting).toBe(true)
  expect(activity.url).toBe('https://intra.epitech.eu/module/2022/B-CPE-100/NAN-1-1/acti-555210')
  expect(activity.deadline).toBeNull()
  expect(activity.begin.getTime()).toBe(dayjs('2022-09-26 00:00:00').toDate().getTime())
  expect(activity.endRegister).toBeNull()
  expect(activity.type).toBe('Course')
  expect(activity.mainType).toBe('class')
})

test('Map Relation ManyToOne', async () => {
  const id: IdOf<Activity> = 'acti-555210'
  const activity = await connector.getOne(Activity, SqlFilter.from(Activity,{id}))

  await activity.map()
  expect(activity.module).toBeInstanceOf(Module)
  assert(activity.module instanceof Module)
  expect(activity.module.id).toBe(40639)
  expect(activity.module.name).toBe('Unix & C Lab Seminar (Part I)')
})

test('Map Relation ManyToMany', async () => {
  const id: IdOf<Location> = 'FR/NAN/Alger-Epitech/Mordor'
  const location = await connector.getOne(Location, SqlFilter.from(Location,{id}))

  await location.map()
  expect(location.types).toHaveLength(1)
  expect(location.types[0].type).toBe('salle-de-cours-td')
  expect(location.types[0].seats).toBe(65)
})

test('Map Relation OneToMany', async () => {
  const id: IdOf<Module> = 42747
  const module = await connector.getOne(Module, SqlFilter.from(Module,{id}))

  await module.map()
  expect(module.flags).toHaveLength(3)
  expect(module.flags).toContainEqual(new ModuleFlag().fromJson({moduleId: id, flag: ModuleFlags.ROADBLOCK}))
})

afterAll(() => {
  connector.close()
})
