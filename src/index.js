/**
 * @name match-sorter
 * @license MIT license.
 * @copyright (c) 2016 Kent C. Dodds
 * @author Kent C. Dodds <kent@doddsfamily.us>
 */
import diacritics from 'diacritic'
import globalObject from 'global-object'

const rankings = {
  EQUAL: 6,
  STARTS_WITH: 5,
  WORD_STARTS_WITH: 4,
  CONTAINS: 3,
  ACRONYM: 2,
  MATCHES: 1,
  NO_MATCH: 0,
}

matchSorter.rankings = rankings

/**
 * Takes an array of items and a value and returns a new array with the items that match the given value
 * @param {Array} items - the items to sort
 * @param {String} value - the value to use for ranking
 * @param {Object} options - Some options to configure the sorter
 * @return {Array} - the new sorted array
 */
function matchSorter(items, value, options = {}) {
  const {keys, threshold = rankings.MATCHES} = options
  const matchedItems = items.reduce(reduceItemsToRanked, [])
  return matchedItems.sort(sortRankedItems).map(({item}) => item)

  function reduceItemsToRanked(matches, item, index) {
    const {rank, keyIndex} = getHighestRanking(item, keys, value, options)
    if (rank >= threshold) {
      matches.push({item, rank, index, keyIndex})
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
 * @return {Number} - the highest ranking
 */
function getHighestRanking(item, keys, value, options) {
  if (!keys) {
    return {rank: getMatchRanking(item, value, options), keyIndex: -1}
  }
  const valuesToRank = getAllValuesToRank(item, keys)
  return valuesToRank.reduce(({rank, keyIndex}, itemValue, i) => {
    const newRank = getMatchRanking(itemValue, value, options)
    if (newRank > rank) {
      rank = newRank
      keyIndex = i
    }
    return {rank, keyIndex}
  }, {rank: rankings.NO_MATCH, keyIndex: -1})
}

/**
 * Gives a rankings score based on how well the two strings match.
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @param {Object} options - options for the match (like keepDiacritics for comparison)
 * @returns {Number} the ranking for how well stringToRank matches testString
 */
function getMatchRanking(testString, stringToRank, options) {
  /* eslint complexity:[2, 8] */
  testString = prepareValueForComparison(testString, options)
  stringToRank = prepareValueForComparison(stringToRank, options)

  // too long
  if (stringToRank.length > testString.length) {
    return rankings.NO_MATCH
  }

  // equals
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

  return stringsByCharOrder(testString, stringToRank)
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
 * Returns a rankings.matches or noMatch score based on whether
 * the characters in the stringToRank are found in order in the
 * testString
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @returns {Number} the ranking for how well stringToRank matches testString
 */
function stringsByCharOrder(testString, stringToRank) {
  let charNumber = 0

  function findMatchingCharacter(matchChar, string) {
    let found = false
    for (let j = charNumber; j < string.length; j++) {
      const stringChar = string[j]
      if (stringChar === matchChar) {
        found = true
        charNumber = j + 1
        break
      }
    }
    return found
  }

  for (let i = 0; i < stringToRank.length; i++) {
    const matchChar = stringToRank[i]
    const found = findMatchingCharacter(matchChar, testString)
    if (!found) {
      return rankings.NO_MATCH
    }
  }
  return rankings.MATCHES
}

/**
 * Sorts items that have a rank, index, and keyIndex
 * @param {Object} a - the first item to sort
 * @param {Object} b - the second item to sort
 * @return {Number} -1 if a should come first, 1 if b should come first
 * Note: will never return 0
 */
function sortRankedItems(a, b) {
  const aFirst = -1
  const bFirst = 1
  const {rank: aRank, index: aIndex, keyIndex: aKeyIndex} = a
  const {rank: bRank, index: bIndex, keyIndex: bKeyIndex} = b
  const same = aRank === bRank
  if (same) {
    if (aKeyIndex === bKeyIndex) {
      return aIndex < bIndex ? aFirst : bFirst
    } else {
      return aKeyIndex < bKeyIndex ? aFirst : bFirst
    }
  } else {
    return aRank > bRank ? aFirst : bFirst
  }
}

/**
 * Prepares value for comparison by stringifying it, removing diacritics (if specified), and toLowerCase-ing it
 * @param {String} value - the value to clean
 * @param {Object} options - {keepDiacritics: whether to remove diacritics}
 * @return {String} the prepared value
 */
function prepareValueForComparison(value, {keepDiacritics}) {
  value = `${value}` // toString
  if (!keepDiacritics) {
    value = diacritics.clean(value)
  }
  return value.toLowerCase()
}

/**
 * Gets value for key in item at arbitrarily nested keypath
 * @param {Object} item - the item
 * @param {Object|Function} key - the potentially nested keypath or property callback
 * @return {String} - the value at nested keypath
 */
function getItemValue(item, key) {
  if (typeof key === 'function') {
    return key(item)
  }
  const isNested = key.indexOf('.') !== -1
  if (!isNested) {
    return item[key]
  }
  return key.split('.').reduce((itemObj, nestedKey) => itemObj[nestedKey], item)
}

/**
 * Gets all the values for the given keys in the given item and returns an array of those values
 * @param {Object} item - the item from which the values will be retrieved
 * @param {Array} keys - the keys to use to retrieve the values
 * @return {Array} the values in an array
 */
function getAllValuesToRank(item, keys) {
  return keys.reduce((allVals, key) => allVals.concat(getItemValue(item, key)), [])
}

// some manual ✨ magic umd ✨ here because Rollup isn't capable of exposing our module the way we want
// see dist-test/index.js
/* istanbul ignore next */
if (typeof exports === 'object' && typeof module !== 'undefined') {
  matchSorter.default = matchSorter
  module.exports = matchSorter
  Object.defineProperty(exports, '__esModule', {value: true})
} else if (typeof define === 'function' && define.amd) { // eslint-disable-line
  define(() => matchSorter) // eslint-disable-line
} else {
  globalObject.matchSorter = matchSorter // eslint-disable-line
}
