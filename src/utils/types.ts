export type IdOf<T> = T extends { id: infer U } ? U : never
