/* eslint import/default:0, import/named:0, import/no-unresolved:0, import/extensions:0, no-console:0 */
/*
 * This file is here to validate that the built version of the library exposes the module in the way that we
 * want it to. Specifically that the ES6 module import can get the matchSorter function via default import and the
 * rankings via named import. Also that the CommonJS require returns the matchSorter function (rather than an object
 * that has the matchSorter as a `default` property).
 *
 * This file is unable to validate the AMD or global exports.
 */
import assert from 'assert'

import cjsImport, {rankings as cjsRankings} from '../dist/cjs'
import umdImport, {rankings as umdRankings} from '../dist/umd/match-sorter'

const cjsRequire = require('../dist/cjs')
const umdRequire = require('../dist/umd/match-sorter')

assert(
  isMatchSorterFunction(cjsImport) && isRankingsObject(cjsRankings),
  'CJS build has a problem with ES6 modules',
)

assert(isMatchSorterFunction(cjsRequire), 'CJS build has a problem with CJS')

assert(
  isMatchSorterFunction(umdImport) && isRankingsObject(umdRankings),
  'UMD build has a problem with ES6 modules',
)

assert(isMatchSorterFunction(umdRequire), 'UMD build has a problem with CJS')

// TODO: how could we validate the AMD/global modules?

console.log('Built modules look good 👍')

function isMatchSorterFunction(thing) {
  if (typeof thing !== 'function') {
    console.error(
      `matchSorter thing should be a function. It's a ${typeof thing}`,
    )
    return false
  }
  if (thing.name !== 'matchSorter') {
    console.error(
      `the function is not called "matchSorter". It's called ${thing.name}`,
    )
    return false
  }
  return isRankingsObject(thing.rankings)
}

function isRankingsObject(thing) {
  if (typeof thing !== 'object') {
    console.error(
      `rankings object thing should be an object. It's a ${typeof thing}`,
    )
    return false
  }
  if (!Object.keys(thing).includes('NO_MATCH')) {
    console.error(
      `rankings object should include a NO_MATCH key. It only has ${Object.keys(
        thing,
      )}`,
    )
    return false
  }
  return true
}
