<div align="center">
<h1>match-sorter</h1>

<p>Simple, expected, and deterministic best-match sorting of an array in JavaScript</p>
</div>

---

**[Demo](https://codesandbox.io/s/wyk856yo48)**

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-17-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]
[![Examples][examples-badge]][examples]
<!-- prettier-ignore-end -->

## The problem

1.  You have a list of dozens, hundreds, or thousands of items
2.  You want to filter and sort those items intelligently (maybe you have a
    filter input for the user)
3.  You want simple, expected, and deterministic sorting of the items (no fancy
    math algorithm that fancily changes the sorting as they type)

## This solution

This follows a simple and sensible (user friendly) algorithm that makes it easy
for you to filter and sort a list of items based on given input. Items are
ranked based on sensible criteria that result in a better user experience.

To explain the ranking system, I'll use countries as an example:

1.  **CASE SENSITIVE EQUALS**: Case-sensitive equality trumps all. These will be
    first. (ex. `France` would match `France`, but not `france`)
2.  **EQUALS**: Case-insensitive equality (ex. `France` would match `france`)
3.  **STARTS WITH**: If the item starts with the given value (ex. `Sou` would
    match `South Korea` or `South Africa`)
4.  **WORD STARTS WITH**: If the item has multiple words, then if one of those
    words starts with the given value (ex. `Repub` would match
    `Dominican Republic`)
5.  **CASE STARTS WITH**: If the item has a defined case (`camelCase`,
    `PascalCase`, `snake_case` or `kebab-case`), then if one of the parts starts
    with the given value (ex. `kingdom` would match `unitedKingdom` or
    `united_kingdom`)
6.  **CASE ACRONYM** If the item's case matches the synonym (ex. `uk` would
    match `united-kingdom` or `UnitedKingdom`)
7.  **CONTAINS**: If the item contains the given value (ex. `ham` would match
    `Bahamas`)
8.  **ACRONYM**: If the item's acronym is the given value (ex. `us` would match
    `United States`)
9.  **SIMPLE MATCH**: If the item has letters in the same order as the letters
    of the given value (ex. `iw` would match `Zimbabwe`, but not `Kuwait`
    because it must be in the same order). Furthermore, if the item is a closer
    match, it will rank higher (ex. `ua` matches `Uruguay` more closely than
    `United States of America`, therefore `Uruguay` will be ordered before
    `United States of America`)

This ranking seems to make sense in people's minds. At least it does in mine.
Feedback welcome!

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
- [Advanced options](#advanced-options)
  - [keys: `[string]`](#keys-string)
  - [threshold: `number`](#threshold-number)
  - [keepDiacritics: `boolean`](#keepdiacritics-boolean)
- [Using ES6?](#using-es6)
- [Inspiration](#inspiration)
- [Other Solutions](#other-solutions)
- [Issues](#issues)
  - [🐛 Bugs](#-bugs)
  - [💡 Feature Requests](#-feature-requests)
- [Contributors ✨](#contributors-)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `dependencies`:

```
npm install match-sorter
```

## Usage

```javascript
import matchSorter from 'match-sorter'
// or const matchSorter = require('match-sorter').default
// or window.matchSorter
const list = ['hi', 'hey', 'hello', 'sup', 'yo']
matchSorter(list, 'h') // ['hi', 'hey', 'hello']
matchSorter(list, 'y') // ['yo', 'hey']
matchSorter(list, 'z') // []
```

## Advanced options

### keys: `[string]`

_Default: `undefined`_

By default it just uses the value itself as above. Passing an array tells
match-sorter which keys to use for the ranking.

```javascript
const objList = [
  {name: 'Janice', color: 'Green'},
  {name: 'Fred', color: 'Orange'},
  {name: 'George', color: 'Blue'},
  {name: 'Jen', color: 'Red'},
]
matchSorter(objList, 'g', {keys: ['name', 'color']})
// [{name: 'George', color: 'Blue'}, {name: 'Janice', color: 'Green'}, {name: 'Fred', color: 'Orange'}]

matchSorter(objList, 're', {keys: ['color', 'name']})
// [{name: 'Jen', color: 'Red'}, {name: 'Janice', color: 'Green'}, {name: 'Fred', color: 'Orange'}, {name: 'George', color: 'Blue'}]
```

**Array of values**: When the specified key matches an array of values, the best
match from the values of in the array is going to be used for the ranking.

```javascript
const iceCreamYum = [
  {favoriteIceCream: ['mint', 'chocolate']},
  {favoriteIceCream: ['candy cane', 'brownie']},
  {favoriteIceCream: ['birthday cake', 'rocky road', 'strawberry']},
]
matchSorter(iceCreamYum, 'cc', {keys: ['favoriteIceCream']})
// [{favoriteIceCream: ['candy cane', 'brownie']}, {favoriteIceCream: ['mint', 'chocolate']}]
```

**Nested Keys**: You can specify nested keys using dot-notation.

```javascript
const nestedObjList = [
  {name: {first: 'Janice'}},
  {name: {first: 'Fred'}},
  {name: {first: 'George'}},
  {name: {first: 'Jen'}},
]
matchSorter(nestedObjList, 'j', {keys: ['name.first']})
// [{name: {first: 'Janice'}}, {name: {first: 'Jen'}}]

const nestedObjList = [
  {name: [{first: 'Janice'}]},
  {name: [{first: 'Fred'}]},
  {name: [{first: 'George'}]},
  {name: [{first: 'Jen'}]},
]
matchSorter(nestedObjList, 'j', {keys: ['name.0.first']})
// [{name: {first: 'Janice'}}, {name: {first: 'Jen'}}]
// matchSorter(nestedObjList, 'j', {keys: ['name[0].first']}) does not work
```

**Property Callbacks**: Alternatively, you may also pass in a callback function
that resolves the value of the key(s) you wish to match on. This is especially
useful when interfacing with libraries such as Immutable.js

```javascript
const list = [{name: 'Janice'}, {name: 'Fred'}, {name: 'George'}, {name: 'Jen'}]
matchSorter(list, 'j', {keys: [item => item.name]})
// [{name: 'Janice'}, {name: 'Jen'}]
```

For more complex structures, expanding on the `nestedObjList` example above, you
can use `map`:

```javascript
const nestedObjList = [
  {
    name: [
      {first: 'Janice', last: 'Smith'},
      {first: 'Jon', last: 'Doe'},
    ],
  },
  {
    name: [
      {first: 'Fred', last: 'Astaire'},
      {first: 'Jenny', last: 'Doe'},
      {first: 'Wilma', last: 'Flintstone'},
    ],
  },
]
matchSorter(nestedObjList, 'doe', {
  keys: [
    item => item.name.map(i => i.first),
    item => item.name.map(i => i.last),
  ],
})
// [name: [{ first: 'Janice', last: 'Smith' },{ first: 'Jon', last: 'Doe' }], name: [{ first: 'Fred', last: 'Astaire' },{ first: 'Jenny', last: 'Doe' },{ first: 'Wilma', last: 'Flintstone' }]]
```

**Threshold**: You may specify an individual threshold for specific keys. A key
will only match if it meets the specified threshold. _For more information
regarding thresholds [see below](#threshold-number)_

```javascript
const list = [
  {name: 'Fred', color: 'Orange'},
  {name: 'Jen', color: 'Red'},
]
matchSorter(list, 'ed', {
  keys: [{threshold: rankings.STARTS_WITH, key: 'name'}, 'color'],
})
//[{name: 'Jen', color: 'Red'}]
```

**Min and Max Ranking**: You may restrict specific keys to a minimum or maximum
ranking by passing in an object. A key with a minimum rank will only get
promoted if there is at least a simple match.

```javascript
const tea = [
  {tea: 'Earl Grey', alias: 'A'},
  {tea: 'Assam', alias: 'B'},
  {tea: 'Black', alias: 'C'},
]
matchSorter(tea, 'A', {
  keys: ['tea', {maxRanking: matchSorter.rankings.STARTS_WITH, key: 'alias'}],
})
// without maxRanking, Earl Grey would come first because the alias "A" would be CASE_SENSITIVE_EQUAL
// `tea` key comes before `alias` key, so Assam comes first even though both match as STARTS_WITH
// [{tea: 'Assam', alias: 'B'}, {tea: 'Earl Grey', alias: 'A'},{tea: 'Black', alias: 'C'}]
```

```javascript
const tea = [
  {tea: 'Milk', alias: 'moo'},
  {tea: 'Oolong', alias: 'B'},
  {tea: 'Green', alias: 'C'},
]
matchSorter(tea, 'oo', {
  keys: ['tea', {minRanking: matchSorter.rankings.EQUAL, key: 'alias'}],
})
// minRanking bumps Milk up to EQUAL from CONTAINS (alias)
// Oolong matches as STARTS_WITH
// Green is missing due to no match
// [{tea: 'Milk', alias: 'moo'}, {tea: 'Oolong', alias: 'B'}]
```

### threshold: `number`

_Default: `MATCHES`_

Thresholds can be used to specify the criteria used to rank the results.
Available thresholds (from top to bottom) are:

- CASE_SENSITIVE_EQUAL
- EQUAL
- STARTS_WITH
- WORD_STARTS_WITH
- STRING_CASE
- STRING_CASE_ACRONYM
- CONTAINS
- ACRONYM
- MATCHES _(default value)_
- NO_MATCH

```javascript
const fruit = ['orange', 'apple', 'grape', 'banana']
matchSorter(fruit, 'ap', {threshold: matchSorter.rankings.NO_MATCH})
// ['apple', 'grape', 'orange', 'banana'] (returns all items, just sorted by best match)

const things = ['google', 'airbnb', 'apple', 'apply', 'app'],
matchSorter(things, 'app', {threshold: matchSorter.rankings.EQUAL})
// ['app'] (only items that are equal)

const otherThings = ['fiji apple', 'google', 'app', 'crabapple', 'apple', 'apply']
matchSorter(otherThings, 'app', {threshold: matchSorter.rankings.WORD_STARTS_WITH})
// ['app', 'apple', 'apply', 'fiji apple'] (everything that matches with "word starts with" or better)
```

### keepDiacritics: `boolean`

_Default: `false`_

By default, match-sorter will strip diacritics before doing any comparisons.
This is the default because it makes the most sense from a UX perspective.

You can disable this behavior by specifying `keepDiacritics: true`

```javascript
const thingsWithDiacritics = [
  'jalapeño',
  'à la carte',
  'café',
  'papier-mâché',
  'à la mode',
]
matchSorter(thingsWithDiacritics, 'aa')
// ['jalapeño', 'à la carte', 'à la mode', 'papier-mâché']

matchSorter(thingsWithDiacritics, 'aa', {keepDiacritics: true})
// ['jalapeño', 'à la carte']

matchSorter(thingsWithDiacritics, 'à', {keepDiacritics: true})
// ['à la carte', 'à la mode']
```

## Using ES6?

In the examples above, we're using CommonJS. If you're using ES6 modules, then
you can do:

`import matchSorter, {rankings, caseRankings} from 'match-sorter'`

## Inspiration

Actually, most of this code was extracted from the _very first_ library I ever
wrote: [genie][genie]!

## Other Solutions

You might try [Fuse.js](https://github.com/krisk/Fuse). It uses advanced math
fanciness to get the closest match. Unfortunately what's "closest" doesn't
always really make sense. So I extracted this from [genie][genie].

## Issues

_Looking to contribute? Look for the [Good First Issue][good-first-issue]
label._

### 🐛 Bugs

Please file an issue for bugs, missing documentation, or unexpected behavior.

[**See Bugs**][bugs]

### 💡 Feature Requests

Please file an issue to suggest new features. Vote on feature requests by adding
a 👍. This helps maintainers prioritize what to work on.

[**See Feature Requests**][requests]

## Contributors ✨

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://kentcdodds.com"><img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;" alt=""/><br /><sub><b>Kent C. Dodds</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=kentcdodds" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=kentcdodds" title="Documentation">📖</a> <a href="#infra-kentcdodds" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=kentcdodds" title="Tests">⚠️</a> <a href="https://github.com/kentcdodds/match-sorter/pulls?q=is%3Apr+reviewed-by%3Akentcdodds" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="http://conorhastings.com"><img src="https://avatars.githubusercontent.com/u/8263298?v=3" width="100px;" alt=""/><br /><sub><b>Conor Hastings</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=conorhastings" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=conorhastings" title="Documentation">📖</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=conorhastings" title="Tests">⚠️</a> <a href="https://github.com/kentcdodds/match-sorter/pulls?q=is%3Apr+reviewed-by%3Aconorhastings" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/rogeliog"><img src="https://avatars.githubusercontent.com/u/574806?v=3" width="100px;" alt=""/><br /><sub><b>Rogelio Guzman</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=rogeliog" title="Documentation">📖</a></td>
    <td align="center"><a href="http://ced.io"><img src="https://avatars.githubusercontent.com/u/1416436?v=3" width="100px;" alt=""/><br /><sub><b>Claudéric Demers</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=clauderic" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=clauderic" title="Documentation">📖</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=clauderic" title="Tests">⚠️</a></td>
    <td align="center"><a href="kevindav.us"><img src="https://avatars3.githubusercontent.com/u/4150097?v=3" width="100px;" alt=""/><br /><sub><b>Kevin Davis</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=osfan501" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=osfan501" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/nfdjps"><img src="https://avatars1.githubusercontent.com/u/19157735?v=3" width="100px;" alt=""/><br /><sub><b>Denver Chen</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=nfdjps" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=nfdjps" title="Documentation">📖</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=nfdjps" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://ruigrok.info"><img src="https://avatars0.githubusercontent.com/u/12719057?v=4" width="100px;" alt=""/><br /><sub><b>Christian Ruigrok</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/issues?q=author%3AChrisRu" title="Bug reports">🐛</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=ChrisRu" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=ChrisRu" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/hozefaj"><img src="https://avatars1.githubusercontent.com/u/2084833?v=4" width="100px;" alt=""/><br /><sub><b>Hozefa</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/issues?q=author%3Ahozefaj" title="Bug reports">🐛</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=hozefaj" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=hozefaj" title="Tests">⚠️</a> <a href="#ideas-hozefaj" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/pushpinder107"><img src="https://avatars3.githubusercontent.com/u/9403361?v=4" width="100px;" alt=""/><br /><sub><b>pushpinder107</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=pushpinder107" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/tikotzky"><img src="https://avatars3.githubusercontent.com/u/200528?v=4" width="100px;" alt=""/><br /><sub><b>Mordy Tikotzky</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=tikotzky" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=tikotzky" title="Documentation">📖</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=tikotzky" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/sdbrannum"><img src="https://avatars1.githubusercontent.com/u/11765845?v=4" width="100px;" alt=""/><br /><sub><b>Steven Brannum</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=sdbrannum" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/commits?author=sdbrannum" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/cmeeren"><img src="https://avatars0.githubusercontent.com/u/7766733?v=4" width="100px;" alt=""/><br /><sub><b>Christer van der Meeren</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/issues?q=author%3Acmeeren" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://securitynull.net/"><img src="https://avatars0.githubusercontent.com/u/3801362?v=4" width="100px;" alt=""/><br /><sub><b>Samuel Petrosyan</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=samyan" title="Code">💻</a> <a href="https://github.com/kentcdodds/match-sorter/issues?q=author%3Asamyan" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://brandonkalinowski.com"><img src="https://avatars3.githubusercontent.com/u/4714862?v=4" width="100px;" alt=""/><br /><sub><b>Brandon Kalinowski</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/issues?q=author%3Abrandonkal" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://codefund.io"><img src="https://avatars2.githubusercontent.com/u/12481?v=4" width="100px;" alt=""/><br /><sub><b>Eric Berry</b></sub></a><br /><a href="#fundingFinding-coderberry" title="Funding Finding">🔍</a></td>
    <td align="center"><a href="https://github.com/skube"><img src="https://avatars3.githubusercontent.com/u/146396?v=4" width="100px;" alt=""/><br /><sub><b>Skubie Doo</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=skube" title="Documentation">📖</a></td>
    <td align="center"><a href="https://michaeldeboey.be"><img src="https://avatars3.githubusercontent.com/u/6643991?v=4" width="100px;" alt=""/><br /><sub><b>Michaël De Boey</b></sub></a><br /><a href="https://github.com/kentcdodds/match-sorter/commits?author=MichaelDeBoey" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## LICENSE

MIT

<!-- prettier-ignore-start -->
[npm]: https://www.npmjs.com
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/kentcdodds/match-sorter.svg?style=flat-square
[build]: https://travis-ci.org/kentcdodds/match-sorter
[coverage-badge]: https://img.shields.io/codecov/c/github/kentcdodds/match-sorter.svg?style=flat-square
[coverage]: https://codecov.io/github/kentcdodds/match-sorter
[version-badge]: https://img.shields.io/npm/v/match-sorter.svg?style=flat-square
[package]: https://www.npmjs.com/package/match-sorter
[downloads-badge]: https://img.shields.io/npm/dm/match-sorter.svg?style=flat-square
[npm-trends]: https://www.npmtrends.com/match-sorter
[license-badge]: https://img.shields.io/npm/l/match-sorter.svg?style=flat-square
[license]: https://github.com/kentcdodds/match-sorter/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/kentcdodds/match-sorter/blob/master/other/CODE_OF_CONDUCT.md
[examples-badge]: https://img.shields.io/badge/%F0%9F%92%A1-examples-8C8E93.svg?style=flat-square
[examples]: https://github.com/kentcdodds/match-sorter/blob/master/other/EXAMPLES.md
[emojis]: https://github.com/all-contributors/all-contributors#emoji-key
[all-contributors]: https://github.com/all-contributors/all-contributors

[genie]: https://github.com/kentcdodds/genie
<!-- prettier-ignore-end -->
