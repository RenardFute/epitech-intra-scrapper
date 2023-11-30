export type IdOf<T> = T extends { id: infer U } ? U : (T extends { discordUserId: infer U } ? U : never)

export type email = string
