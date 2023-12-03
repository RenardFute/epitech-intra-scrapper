/**
 * Get the type of the id of an object (if it exists)
 * @category Types
 * @example
 * type User = { id: number, name: string }
 * type UserId = IdOf<User> // number
 * type UserWithoutId = { name: string }
 * type UserWithoutIdId = IdOf<UserWithoutId> // never
 * type UserWithDiscordId = { discordUserId: string }
 * type UserWithDiscordIdId = IdOf<UserWithDiscordId> // string
 *
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export type IdOf<T> = T extends { id: infer U } ? U : (T extends { discordUserId: infer U } ? U : never)
