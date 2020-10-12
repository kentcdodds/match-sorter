/**
 * @name match-sorter
 * @license MIT license.
 * @copyright (c) 2019 Kent C. Dodds
 * @author Kent C. Dodds <kent@doddsfamily.us>
 */
import removeAccents from 'remove-accents'

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

const defaultBaseSortFn = (a, b) =>
  String(a.rankedItem).localeCompare(b.rankedItem)

/**
 * Takes an array of items and a value and returns a new array with the items that match the given value
 * @param {Array} items - the items to sort
 * @param {String} value - the value to use for ranking
 * @param {Object} options - Some options to configure the sorter
 * @return {Array} - the new sorted array
 */
function matchSorter(items, value, options = {}) {
  const {
    keys,
    threshold = rankings.MATCHES,
    baseSort = defaultBaseSortFn,
  } = options
  const matchedItems = items.reduce(reduceItemsToRanked, [])
  return matchedItems
    .sort((a, b) => sortRankedItems(a, b, baseSort))
    .map(({item}) => item)

  function reduceItemsToRanked(matches, item, index) {
    const {
      rankedItem,
      rank,
      keyIndex,
      keyThreshold = threshold,
    } = getHighestRanking(item, keys, value, options)
    if (rank >= keyThreshold) {
      matches.push({rankedItem, item, rank, index, keyIndex})
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
function getHighestRanking(item, keys, value, options) {
  if (!keys) {
    return {
      // ends up being duplicate of 'item' in matches but consistent
      rankedItem: item,
      rank: getMatchRanking(item, value, options),
      keyIndex: -1,
      keyThreshold: options.threshold,
    }
  }
  const valuesToRank = getAllValuesToRank(item, keys)
  return valuesToRank.reduce(
    (
      {rank, rankedItem, keyIndex, keyThreshold},
      {itemValue, attributes},
      i,
    ) => {
      let newRank = getMatchRanking(itemValue, value, options)
      let newRankedItem = rankedItem
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
        newRankedItem = itemValue
      }
      return {rankedItem: newRankedItem, rank, keyIndex, keyThreshold}
    },
    {rank: rankings.NO_MATCH, keyIndex: -1, keyThreshold: options.threshold},
  )
}

/**
 * Gives a rankings score based on how well the two strings match.
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @param {Object} options - options for the match (like keepDiacritics for comparison)
 * @returns {Number} the ranking for how well stringToRank matches testString
 */
function getMatchRanking(testString, stringToRank, options) {
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
  if (testString.indexOf(stringToRank) === 0) {
    return rankings.STARTS_WITH
  }

  // word starts with
  if (testString.indexOf(` ${stringToRank}`) !== -1) {
    return rankings.WORD_STARTS_WITH
  }

  // contains
  if (testString.indexOf(stringToRank) !== -1) {
    return rankings.CONTAINS
  } else if (stringToRank.length === 1) {
    // If the only character in the given stringToRank
    //   isn't even contained in the testString, then
    //   it's definitely not a match.
    return rankings.NO_MATCH
  }

  // acronym
  if (getAcronym(testString).indexOf(stringToRank) !== -1) {
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
function getAcronym(string) {
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
function getClosenessRanking(testString, stringToRank) {
  let matchingInOrderCharCount = 0
  let charNumber = 0
  function findMatchingCharacter(matchChar, string, index) {
    for (let j = index; j < string.length; j++) {
      const stringChar = string[j]
      if (stringChar === matchChar) {
        matchingInOrderCharCount += 1
        return j + 1
      }
    }
    return -1
  }
  function getRanking(spread) {
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
function sortRankedItems(a, b, baseSort) {
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
function prepareValueForComparison(value, {keepDiacritics}) {
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
function getItemValues(item, key) {
  if (typeof key === 'object') {
    key = key.key
  }
  let value
  if (typeof key === 'function') {
    value = key(item)
    // eslint-disable-next-line no-negated-condition
  } else if (key.indexOf('.') !== -1) {
    // handle nested keys
    value = key
      .split('.')
      .reduce(
        (itemObj, nestedKey) => (itemObj ? itemObj[nestedKey] : null),
        item,
      )
  } else {
    value = item[key]
  }
  // concat because `value` can be a string or an array
  // eslint-disable-next-line
  return value != null ? [].concat(value) : null
}

/**
 * Gets all the values for the given keys in the given item and returns an array of those values
 * @param {Object} item - the item from which the values will be retrieved
 * @param {Array} keys - the keys to use to retrieve the values
 * @return {Array} objects with {itemValue, attributes}
 */
function getAllValuesToRank(item, keys) {
  return keys.reduce((allVals, key) => {
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
  }, [])
}

/**
 * Gets all the attributes for the given key
 * @param {Object|String} key - the key from which the attributes will be retrieved
 * @return {Object} object containing the key's attributes
 */
function getKeyAttributes(key) {
  if (typeof key === 'string') {
    key = {key}
  }
  return {
    maxRanking: Infinity,
    minRanking: -Infinity,
    ...key,
  }
}

export {matchSorter, rankings}
