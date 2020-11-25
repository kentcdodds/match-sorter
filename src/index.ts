/**
 * @name match-sorter
 * @license MIT license.
 * @copyright (c) 2020 Kent C. Dodds
 * @author Kent C. Dodds <me@kentcdodds.com> (https://kentcdodds.com)
 */
import removeAccents from 'remove-accents'
import type {Merge} from 'type-fest'

type KeyAttributes = {
  threshold?: number
  maxRanking: number
  minRanking: number
}
type RankingInfo = {
  rankedValue: string
  rank: number
  keyIndex: number
  keyThreshold: number | undefined
}

declare function valueGetterKey<ItemType>(item: ItemType): string
declare function baseSortFn<ItemType>(
  a: Merge<RankingInfo, {item: ItemType; index: number}>,
  b: Merge<RankingInfo, {item: ItemType; index: number}>,
): number

type KeyAttributesOptions = {
  key?: string | typeof valueGetterKey
  threshold?: number
  maxRanking?: number
  minRanking?: number
}
type KeyOption = KeyAttributesOptions | typeof valueGetterKey | string
type MatchSorterOptions = {
  keys?: Array<KeyOption>
  threshold?: number
  baseSort?: typeof baseSortFn
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

const defaultBaseSortFn: typeof baseSortFn = (a, b) =>
  String(a.rankedValue).localeCompare(String(b.rankedValue))

/**
 * Takes an array of items and a value and returns a new array with the items that match the given value
 * @param {Array} items - the items to sort
 * @param {String} value - the value to use for ranking
 * @param {Object} options - Some options to configure the sorter
 * @return {Array} - the new sorted array
 */
function matchSorter<ItemType>(
  items: Array<ItemType>,
  value: string,
  options: MatchSorterOptions = {},
): Array<ItemType> {
  const {
    keys,
    threshold = rankings.MATCHES,
    baseSort = defaultBaseSortFn,
  } = options
  type Matched = Merge<RankingInfo, {item: ItemType; index: number}>
  const matchedItems = items.reduce<Array<Matched>>(reduceItemsToRanked, [])
  return matchedItems
    .sort((a, b) => sortRankedValues<ItemType>(a, b, baseSort))
    .map(({item}) => item)

  function reduceItemsToRanked(
    matches: Array<Matched>,
    item: ItemType,
    index: number,
  ): Array<Matched> {
    const rankingInfo = getHighestRanking<ItemType>(item, keys, value, options)
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
  keys: Array<KeyOption> | undefined,
  value: string,
  options: MatchSorterOptions,
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
  const valuesToRank = getAllValuesToRank<ItemType>(item, keys)
  return valuesToRank.reduce<{
    rankedValue: string
    rank: number
    keyIndex: number
    keyThreshold: number | undefined
  }>(
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
function getMatchRanking(
  testString: string,
  stringToRank: string,
  options: MatchSorterOptions,
): number {
  /* eslint complexity:[2, 12] */
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
  a: Merge<RankingInfo, {item: ItemType; index: number}>,
  b: Merge<RankingInfo, {item: ItemType; index: number}>,
  baseSort: typeof baseSortFn,
): number {
  const aFirst = -1
  const bFirst = 1
  const {rank: aRank, keyIndex: aKeyIndex} = a
  const {rank: bRank, keyIndex: bKeyIndex} = b
  const same = aRank === bRank
  if (same) {
    if (aKeyIndex === bKeyIndex) {
      // use the base sort function as a tie-breaker
      return baseSort<ItemType>(a, b)
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
function prepareValueForComparison(
  value: string,
  {keepDiacritics}: MatchSorterOptions,
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
  key: KeyOption,
): Array<string> | null {
  if (typeof key === 'object') {
    key = key.key as string
  }
  let value: string | Array<string> | null
  if (typeof key === 'function') {
    value = key<ItemType>(item)
    // eslint-disable-next-line no-negated-condition
  } else {
    value = getNestedValue<ItemType>(key, item)
  }
  const values: Array<string> = []
  // concat because `value` can be a string or an array
  // eslint-disable-next-line
  return value != null ? values.concat(value) : null
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
  return key.split('.').reduce((itemObj: object | null, nestedKey: string):
    | object
    | string
    | null => {
    // @ts-expect-error lost on this one as well...
    return itemObj ? itemObj[nestedKey] : null
  }, obj)
}

/**
 * Gets all the values for the given keys in the given item and returns an array of those values
 * @param item - the item from which the values will be retrieved
 * @param keys - the keys to use to retrieve the values
 * @return objects with {itemValue, attributes}
 */
function getAllValuesToRank<ItemType>(item: ItemType, keys: Array<KeyOption>) {
  return keys.reduce<Array<{itemValue: string; attributes: KeyAttributes}>>(
    (allVals, key) => {
      const values = getItemValues<ItemType>(item, key)
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
function getKeyAttributes(key: KeyOption): KeyAttributes {
  if (typeof key === 'string') {
    return defaultKeyAttributes
  }
  return {...defaultKeyAttributes, ...key}
}

export {
  matchSorter,
  rankings,
  MatchSorterOptions,
  KeyAttributesOptions,
  KeyOption,
  KeyAttributes,
  RankingInfo,
  baseSortFn,
  valueGetterKey,
}
