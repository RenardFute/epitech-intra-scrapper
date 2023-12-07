import type {Config} from '@jest/types'

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: "tests/tsconfig.json"
    }]
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  detectOpenHandles: true
}
export default config
