/**
 * @name match-sorter
 * @license MIT license.
 * @copyright (c) 2020 Kent C. Dodds
 * @author Kent C. Dodds <me@kentcdodds.com> (https://kentcdodds.com)
 */
import removeAccents from 'remove-accents'

type KeyAttributes = {
  threshold?: number
  maxRanking: number
  minRanking: number
}
interface RankingInfo {
  rankedValue: string
  rank: number
  keyIndex: number
  keyThreshold: number | undefined
}

interface ValueGetterKey<ItemType> {
  (item: ItemType): string | Array<string>
}
interface IndexedItem<ItemType> {
  item: ItemType
  index: number
}
interface RankedItem<ItemType> extends RankingInfo, IndexedItem<ItemType> {}

interface BaseSorter<ItemType> {
  (a: RankedItem<ItemType>, b: RankedItem<ItemType>): number
}

interface KeyAttributesOptions<ItemType> {
  key?: string | ValueGetterKey<ItemType>
  threshold?: number
  maxRanking?: number
  minRanking?: number
}

type KeyOption<ItemType> =
  | KeyAttributesOptions<ItemType>
  | ValueGetterKey<ItemType>
  | string

// ItemType = unknown allowed me to make these changes without the need to change the current tests
interface MatchSorterOptions<ItemType = unknown> {
  keys?: Array<KeyOption<ItemType>>
  threshold?: number
  baseSort?: BaseSorter<ItemType>
  keepDiacritics?: boolean
}

const rankings = {
  CASE_SENSITIVE_EQUAL: 7,
  EQUAL: 6,
  STARTS_WITH: 5,
  WORD_STARTS_WITH: 4,
  CONTAINS: 3,
  ACRONYM: 2,
  MATCHES: 1,
  NO_MATCH: 0,
}

matchSorter.rankings = rankings

const defaultBaseSortFn: BaseSorter<unknown> = (a, b) =>
  String(a.rankedValue).localeCompare(String(b.rankedValue))

/**
 * Takes an array of items and a value and returns a new array with the items that match the given value
 * @param {Array} items - the items to sort
 * @param {String} value - the value to use for ranking
 * @param {Object} options - Some options to configure the sorter
 * @return {Array} - the new sorted array
 */
function matchSorter<ItemType = string>(
  items: Array<ItemType>,
  value: string,
  options: MatchSorterOptions<ItemType> = {},
): Array<ItemType> {
  const {
    keys,
    threshold = rankings.MATCHES,
    baseSort = defaultBaseSortFn,
  } = options
  const matchedItems = items.reduce(reduceItemsToRanked, [])
  return matchedItems
    .sort((a, b) => sortRankedValues(a, b, baseSort))
    .map(({item}) => item)

  function reduceItemsToRanked(
    matches: Array<RankedItem<ItemType>>,
    item: ItemType,
    index: number,
  ): Array<RankedItem<ItemType>> {
    const rankingInfo = getHighestRanking(item, keys, value, options)
    const {rank, keyThreshold = threshold} = rankingInfo
    if (rank >= keyThreshold) {
      matches.push({...rankingInfo, item, index})
    }
    return matches
  }
}

/**
 * Gets the highest ranking for value for the given item based on its values for the given keys
 * @param {*} item - the item to rank
 * @param {Array} keys - the keys to get values from the item for the ranking
 * @param {String} value - the value to rank against
 * @param {Object} options - options to control the ranking
 * @return {{rank: Number, keyIndex: Number, keyThreshold: Number}} - the highest ranking
 */
function getHighestRanking<ItemType>(
  item: ItemType,
  keys: Array<KeyOption<ItemType>> | undefined,
  value: string,
  options: MatchSorterOptions<ItemType>,
): RankingInfo {
  if (!keys) {
    // if keys is not specified, then we assume the item given is ready to be matched
    const stringItem = (item as unknown) as string
    return {
      // ends up being duplicate of 'item' in matches but consistent
      rankedValue: stringItem,
      rank: getMatchRanking(stringItem, value, options),
      keyIndex: -1,
      keyThreshold: options.threshold,
    }
  }
  const valuesToRank = getAllValuesToRank(item, keys)
  return valuesToRank.reduce(
    (
      {rank, rankedValue, keyIndex, keyThreshold},
      {itemValue, attributes},
      i,
    ) => {
      let newRank = getMatchRanking(itemValue, value, options)
      let newRankedValue = rankedValue
      const {minRanking, maxRanking, threshold} = attributes
      if (newRank < minRanking && newRank >= rankings.MATCHES) {
        newRank = minRanking
      } else if (newRank > maxRanking) {
        newRank = maxRanking
      }
      if (newRank > rank) {
        rank = newRank
        keyIndex = i
        keyThreshold = threshold
        newRankedValue = itemValue
      }
      return {rankedValue: newRankedValue, rank, keyIndex, keyThreshold}
    },
    {
      rankedValue: (item as unknown) as string,
      rank: rankings.NO_MATCH,
      keyIndex: -1,
      keyThreshold: options.threshold,
    },
  )
}

/**
 * Gives a rankings score based on how well the two strings match.
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @param {Object} options - options for the match (like keepDiacritics for comparison)
 * @returns {Number} the ranking for how well stringToRank matches testString
 */
function getMatchRanking<ItemType>(
  testString: string,
  stringToRank: string,
  options: MatchSorterOptions<ItemType>,
): number {
  testString = prepareValueForComparison(testString, options)
  stringToRank = prepareValueForComparison(stringToRank, options)

  // too long
  if (stringToRank.length > testString.length) {
    return rankings.NO_MATCH
  }

  // case sensitive equals
  if (testString === stringToRank) {
    return rankings.CASE_SENSITIVE_EQUAL
  }

  // Lower casing before further comparison
  testString = testString.toLowerCase()
  stringToRank = stringToRank.toLowerCase()

  // case insensitive equals
  if (testString === stringToRank) {
    return rankings.EQUAL
  }

  // starts with
  if (testString.startsWith(stringToRank)) {
    return rankings.STARTS_WITH
  }

  // word starts with
  if (testString.includes(` ${stringToRank}`)) {
    return rankings.WORD_STARTS_WITH
  }

  // contains
  if (testString.includes(stringToRank)) {
    return rankings.CONTAINS
  } else if (stringToRank.length === 1) {
    // If the only character in the given stringToRank
    //   isn't even contained in the testString, then
    //   it's definitely not a match.
    return rankings.NO_MATCH
  }

  // acronym
  if (getAcronym(testString).includes(stringToRank)) {
    return rankings.ACRONYM
  }

  // will return a number between rankings.MATCHES and
  // rankings.MATCHES + 1 depending  on how close of a match it is.
  return getClosenessRanking(testString, stringToRank)
}

/**
 * Generates an acronym for a string.
 *
 * @param {String} string the string for which to produce the acronym
 * @returns {String} the acronym
 */
function getAcronym(string: string): string {
  let acronym = ''
  const wordsInString = string.split(' ')
  wordsInString.forEach(wordInString => {
    const splitByHyphenWords = wordInString.split('-')
    splitByHyphenWords.forEach(splitByHyphenWord => {
      acronym += splitByHyphenWord.substr(0, 1)
    })
  })
  return acronym
}

/**
 * Returns a score based on how spread apart the
 * characters from the stringToRank are within the testString.
 * A number close to rankings.MATCHES represents a loose match. A number close
 * to rankings.MATCHES + 1 represents a tighter match.
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @returns {Number} the number between rankings.MATCHES and
 * rankings.MATCHES + 1 for how well stringToRank matches testString
 */
function getClosenessRanking(testString: string, stringToRank: string): number {
  let matchingInOrderCharCount = 0
  let charNumber = 0
  function findMatchingCharacter(
    matchChar: string,
    string: string,
    index: number,
  ) {
    for (let j = index; j < string.length; j++) {
      const stringChar = string[j]
      if (stringChar === matchChar) {
        matchingInOrderCharCount += 1
        return j + 1
      }
    }
    return -1
  }
  function getRanking(spread: number) {
    const spreadPercentage = 1 / spread
    const inOrderPercentage = matchingInOrderCharCount / stringToRank.length
    const ranking = rankings.MATCHES + inOrderPercentage * spreadPercentage
    return ranking
  }
  const firstIndex = findMatchingCharacter(stringToRank[0], testString, 0)
  if (firstIndex < 0) {
    return rankings.NO_MATCH
  }
  charNumber = firstIndex
  for (let i = 1; i < stringToRank.length; i++) {
    const matchChar = stringToRank[i]
    charNumber = findMatchingCharacter(matchChar, testString, charNumber)
    const found = charNumber > -1
    if (!found) {
      return rankings.NO_MATCH
    }
  }

  const spread = charNumber - firstIndex
  return getRanking(spread)
}

/**
 * Sorts items that have a rank, index, and keyIndex
 * @param {Object} a - the first item to sort
 * @param {Object} b - the second item to sort
 * @return {Number} -1 if a should come first, 1 if b should come first, 0 if equal
 */
function sortRankedValues<ItemType>(
  a: RankedItem<ItemType>,
  b: RankedItem<ItemType>,
  baseSort: BaseSorter<ItemType>,
): number {
  const aFirst = -1
  const bFirst = 1
  const {rank: aRank, keyIndex: aKeyIndex} = a
  const {rank: bRank, keyIndex: bKeyIndex} = b
  const same = aRank === bRank
  if (same) {
    if (aKeyIndex === bKeyIndex) {
      // use the base sort function as a tie-breaker
      return baseSort(a, b)
    } else {
      return aKeyIndex < bKeyIndex ? aFirst : bFirst
    }
  } else {
    return aRank > bRank ? aFirst : bFirst
  }
}

/**
 * Prepares value for comparison by stringifying it, removing diacritics (if specified)
 * @param {String} value - the value to clean
 * @param {Object} options - {keepDiacritics: whether to remove diacritics}
 * @return {String} the prepared value
 */
function prepareValueForComparison<ItemType>(
  value: string,
  {keepDiacritics}: MatchSorterOptions<ItemType>,
): string {
  // value might not actually be a string at this point (we don't get to choose)
  // so part of preparing the value for comparison is ensure that it is a string
  value = `${value}` // toString
  if (!keepDiacritics) {
    value = removeAccents(value)
  }
  return value
}

/**
 * Gets value for key in item at arbitrarily nested keypath
 * @param {Object} item - the item
 * @param {Object|Function} key - the potentially nested keypath or property callback
 * @return {Array} - an array containing the value(s) at the nested keypath
 */
function getItemValues<ItemType>(
  item: ItemType,
  key: KeyOption<ItemType>,
): Array<string> {
  if (typeof key === 'object') {
    key = key.key as string
  }
  let value: string | Array<string> | null
  if (typeof key === 'function') {
    value = key(item)
  } else {
    value = getNestedValue<ItemType>(key, item)
  }

  // because `value` can also be undefined
  if (value == null) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  return [value]
}

/**
 * Given key: "foo.bar.baz"
 * And obj: {foo: {bar: {baz: 'buzz'}}}
 *   -> 'buzz'
 * @param key a dot-separated set of keys
 * @param obj the object to get the value from
 */
function getNestedValue<ItemType>(
  key: string,
  obj: ItemType,
): string | Array<string> | null {
  // @ts-expect-error really have no idea how to type this properly...
  return key.split('.').reduce((value: object | null, nestedKey: string):
    | object
    | string
    | null => {
    if (value == null) {
      return null
    }

    if (Object.hasOwnProperty.call(value,nestedKey)) {
      // @ts-expect-error lost on this one as well...
      const nestedValue = value[nestedKey]
      if (nestedValue != null) {
        return nestedValue
      }
      return null
    }

    if (Array.isArray(value)) {
      if (nestedKey === "*") {
        // ignore explicit wildcards
        return value
      }

      return value.reduce((values: Array<object | string>, arrayValue: object):
        | object
        | string
        | null => {
          if (arrayValue != null && Object.hasOwnProperty.call(arrayValue,nestedKey)) {
            // @ts-expect-error and here again...
            const nestedArrayValue = arrayValue[nestedKey]
            if (nestedArrayValue != null) {
              values.push(nestedArrayValue)
            }
          }
          return values
        }, [])
    }

    return null
  }, obj)
}

/**
 * Gets all the values for the given keys in the given item and returns an array of those values
 * @param item - the item from which the values will be retrieved
 * @param keys - the keys to use to retrieve the values
 * @return objects with {itemValue, attributes}
 */
function getAllValuesToRank<ItemType>(
  item: ItemType,
  keys: Array<KeyOption<ItemType>>,
) {
  return keys.reduce<Array<{itemValue: string; attributes: KeyAttributes}>>(
    (allVals, key) => {
      const values = getItemValues(item, key)
      if (values) {
        values.forEach(itemValue => {
          allVals.push({
            itemValue,
            attributes: getKeyAttributes(key),
          })
        })
      }
      return allVals
    },
    [],
  )
}

const defaultKeyAttributes = {
  maxRanking: Infinity,
  minRanking: -Infinity,
}
/**
 * Gets all the attributes for the given key
 * @param key - the key from which the attributes will be retrieved
 * @return object containing the key's attributes
 */
function getKeyAttributes<ItemType>(key: KeyOption<ItemType>): KeyAttributes {
  if (typeof key === 'string') {
    return defaultKeyAttributes
  }
  return {...defaultKeyAttributes, ...key}
}

export {matchSorter, rankings, defaultBaseSortFn}

export type {
  MatchSorterOptions,
  KeyAttributesOptions,
  KeyOption,
  KeyAttributes,
  RankingInfo,
  ValueGetterKey,
}
