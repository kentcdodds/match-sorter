/**
 * @name match-sorter
 * @license MIT license.
 * @copyright (c) 2017 Kent C. Dodds
 * @author Kent C. Dodds <kent@doddsfamily.us>
 */
import removeAccents from 'remove-accents'

const rankings = {
  CASE_SENSITIVE_EQUAL: 9,
  EQUAL: 8,
  STARTS_WITH: 7,
  WORD_STARTS_WITH: 6,
  STRING_CASE: 5,
  STRING_CASE_ACRONYM: 4,
  CONTAINS: 3,
  ACRONYM: 2,
  MATCHES: 1,
  NO_MATCH: 0,
}

const caseRankings = {
  CAMEL: 0.8,
  PASCAL: 0.6,
  KEBAB: 0.4,
  SNAKE: 0.2,
  NO_CASE: 0,
}

matchSorter.rankings = rankings
matchSorter.caseRankings = caseRankings

/**
 * Takes an array of items and a value and returns a new array with the items that match the given value
 * @param {Array} items - the items to sort
 * @param {String} value - the value to use for ranking
 * @param {Object} options - Some options to configure the sorter
 * @return {Array} - the new sorted array
 */
function matchSorter(items, value, options = {}) {
  // not performing any search/sort if value(search term) is empty
  if (!value) return items

  const {keys, threshold = rankings.MATCHES} = options
  const matchedItems = items.reduce(reduceItemsToRanked, [])
  return matchedItems.sort(sortRankedItems).map(({item}) => item)

  function reduceItemsToRanked(matches, item, index) {
    const {rank, keyIndex, keyThreshold = threshold} = getHighestRanking(
      item,
      keys,
      value,
      options,
    )
    if (rank >= keyThreshold) {
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
 * @return {{rank: Number, keyIndex: Number, keyThreshold: Number}} - the highest ranking
 */
function getHighestRanking(item, keys, value, options) {
  if (!keys) {
    return {
      rank: getMatchRanking(item, value, options),
      keyIndex: -1,
      keyThreshold: options.threshold,
    }
  }
  const valuesToRank = getAllValuesToRank(item, keys)
  return valuesToRank.reduce(
    ({rank, keyIndex, keyThreshold}, {itemValue, attributes}, i) => {
      let newRank = getMatchRanking(itemValue, value, options)
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
      }
      return {rank, keyIndex, keyThreshold}
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

  const caseRank = getCaseRanking(testString)
  const isPartial = isPartialOfCase(testString, stringToRank, caseRank)
  const isCasedAcronym = isCaseAcronym(testString, stringToRank, caseRank)

  // Lower casing before further comparison
  testString = testString.toLowerCase()
  stringToRank = stringToRank.toLowerCase()

  // case insensitive equals
  if (testString === stringToRank) {
    return rankings.EQUAL + caseRank
  }

  // starts with
  if (testString.indexOf(stringToRank) === 0) {
    return rankings.STARTS_WITH + caseRank
  }

  // word starts with
  if (testString.indexOf(` ${stringToRank}`) !== -1) {
    return rankings.WORD_STARTS_WITH + caseRank
  }

  // is a part inside a cased string
  if (isPartial) {
    return rankings.STRING_CASE + caseRank
  }

  // is acronym for a cased string
  if (caseRank > 0 && isCasedAcronym) {
    return rankings.STRING_CASE_ACRONYM + caseRank
  }

  // contains
  if (testString.indexOf(stringToRank) !== -1) {
    return rankings.CONTAINS + caseRank
  } else if (stringToRank.length === 1) {
    // If the only character in the given stringToRank
    //   isn't even contained in the testString, then
    //   it's definitely not a match.
    return rankings.NO_MATCH
  }

  // acronym
  if (getAcronym(testString).indexOf(stringToRank) !== -1) {
    return rankings.ACRONYM + caseRank
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
 * Returns a score base on the case of the testString
 * @param {String} testString - the string to test against
 * @returns {Number} the number of the ranking,
 * based on the case between 0 and 1 for how the testString matches the case
 */
function getCaseRanking(testString) {
  const containsUpperCase = testString.toLowerCase() !== testString
  const containsDash = testString.indexOf('-') >= 0
  const containsUnderscore = testString.indexOf('_') >= 0

  if (!containsUpperCase && !containsUnderscore && containsDash) {
    return caseRankings.KEBAB
  }

  if (!containsUpperCase && containsUnderscore && !containsDash) {
    return caseRankings.SNAKE
  }

  if (containsUpperCase && !containsDash && !containsUnderscore) {
    const startsWithUpperCase = testString[0].toUpperCase() === testString[0]
    if (startsWithUpperCase) {
      return caseRankings.PASCAL
    }

    return caseRankings.CAMEL
  }

  return caseRankings.NO_CASE
}

/**
 * Returns whether the stringToRank is one of the case parts in the testString (works with any string case)
 * @example
 * // returns true
 * isPartialOfCase('helloWorld', 'world', caseRankings.CAMEL)
 * @example
 * // returns false
 * isPartialOfCase('helloWorld', 'oworl', caseRankings.CAMEL)
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @param {Number} caseRanking - the ranking score based on case of testString
 * @returns {Boolean} whether the stringToRank is one of the case parts in the testString
 */
function isPartialOfCase(testString, stringToRank, caseRanking) {
  const testIndex = testString.toLowerCase().indexOf(stringToRank.toLowerCase())

  switch (caseRanking) {
    case caseRankings.SNAKE:
      return testString[testIndex - 1] === '_'
    case caseRankings.KEBAB:
      return testString[testIndex - 1] === '-'
    case caseRankings.PASCAL:
    case caseRankings.CAMEL:
      return (
        testIndex !== -1 &&
        testString[testIndex] === testString[testIndex].toUpperCase()
      )
    default:
      return false
  }
}

/**
 * Check if stringToRank is an acronym for a partial case
 * @example
 * // returns true
 * isCaseAcronym('super_duper_file', 'sdf', caseRankings.SNAKE)
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the acronym to test
 * @param {Number} caseRank - the ranking of the case
 * @returns {Boolean} whether the stringToRank is an acronym for the testString
 */
function isCaseAcronym(testString, stringToRank, caseRank) {
  let splitValue = null
  switch (caseRank) {
    case caseRankings.SNAKE:
      splitValue = '_'
      break
    case caseRankings.KEBAB:
      splitValue = '-'
      break
    case caseRankings.PASCAL:
    case caseRankings.CAMEL:
      splitValue = /(?=[A-Z])/
      break
    default:
      splitValue = null
  }

  const splitTestString = testString.split(splitValue)
  return stringToRank
    .toLowerCase()
    .split('')
    .reduce((correct, char, charIndex) => {
      const splitItem = splitTestString[charIndex]
      return correct && splitItem && splitItem[0].toLowerCase() === char
    }, true)
}

/**
 * Returns a score based on how spread apart the
 * characters from the stringToRank are within the testString.
 * A number close to rankings.MATCHES represents a loose match. A number close
 * to rankings.MATCHES + 1 represents a loose match.
 * @param {String} testString - the string to test against
 * @param {String} stringToRank - the string to rank
 * @returns {Number} the number between rankings.MATCHES and
 * rankings.MATCHES + 1 for how well stringToRank matches testString
 */
function getClosenessRanking(testString, stringToRank) {
  let charNumber = 0
  function findMatchingCharacter(matchChar, string, index) {
    for (let j = index; j < string.length; j++) {
      const stringChar = string[j]
      if (stringChar === matchChar) {
        return j + 1
      }
    }
    return -1
  }
  function getRanking(spread) {
    const matching = spread - stringToRank.length + 1
    const ranking = rankings.MATCHES + 1 / matching
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

export default matchSorter
export {rankings}
