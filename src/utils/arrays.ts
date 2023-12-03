/**
 * Returns the first element in the array that satisfies the predicate.
 * This function is asynchronous and will wait for the predicate to resolve.
 * If no element satisfies the predicate, undefined is returned.
 *
 * @param array - The array to search in
 * @param predicate - The predicate to use to test elements
 * @returns The first element in the array that satisfies the predicate, or undefined if none does
 *
 * @example
 * const array = [1, 2, 3, 4, 5]
 * const predicate = async (n: number) => n % 2 === 0
 * const result = await findAsync(array, predicate)
 * console.log(result) // 2
 *
 * @category Utils
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export async function findAsyncSequential<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>,
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) {
      return t
    }
  }
  return undefined
}
