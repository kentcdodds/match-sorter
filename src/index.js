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
export {matchSorter as default, rankings}

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
    const {rank, keyIndex} = getHighestRanking(item, keys, value)
    if (rank >= threshold) {
      matches.push({item, rank, index, keyIndex})
    }
    return matches
  }
}

function getHighestRanking(item, keys, value) {
  if (!keys) {
    return {rank: getMatchRanking(item, value), keyIndex: -1}
  }
  return keys.reduce(({rank, keyIndex}, key, i) => {
    const newRank = getMatchRanking(item[key], value)
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
 * @returns {Number} the ranking for how well stringToRank matches testString
 */
function getMatchRanking(testString, stringToRank) {
  /* eslint complexity:[2, 8] */
  testString = (`${testString}`).toLowerCase()
  stringToRank = (`${stringToRank}`).toLowerCase()

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

module.exports = exports.default // CommonJS compat
