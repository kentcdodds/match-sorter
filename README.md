# match-sorter

Simple, expected, and deterministic best-match sorting of an array in JavaScript. **[Demo](https://jsbin.com/vewoka/edit?js,output)**

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Dependencies][dependencyci-badge]][dependencyci]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]
[![MIT License][license-badge]][LICENSE]

[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome][prs-badge]][prs]
[![Donate][donate-badge]][donate]
[![Code of Conduct][coc-badge]][coc]
[![Roadmap][roadmap-badge]][roadmap]
[![Examples][examples-badge]][examples]

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]

## The problem

1. You have a list of dozens, hundreds, or thousands of items
2. You want to filter and sort those items intelligently (maybe you have a filter input for the user)
3. You want simple, expected, and deterministic sorting of the items (no fancy math algorithm that fancily changes the sorting as they type)

## This solution

This follows a simple and sensible (user friendly) algorithm that makes it easy for you to filter and sort a list of items based on given input. Items are ranked based on sensible criteria that result in a better user experience.

To explain the ranking system, I'll use countries as an example:

1. **CASE SENSITIVE EQUALS**: Case-sensitive equality trumps all. These will be first. (ex. `France` would match `France `, but not `france`)
2. **EQUALS**: Case-insensitive equality (ex. `France` would match `france`)
3. **STARTS WITH**: If the item starts with the given value (ex. `Sou` would match `South Korea` or `South Africa`)
4. **WORD STARTS WITH**: If the item has multiple words, then if one of those words starts with the given value (ex. `Repub` would match `Dominican Republic`)
5. **CONTAINS**: If the item contains the given value (ex. `ham` would match `Bahamas`)
6. **ACRONYM**: If the item's acronym is the given value (ex. `us` would match `United States`)
7. **SIMPLE MATCH**: If the item has letters in the same order as the letters of the given value (ex. `iw` would match `Zimbabwe`, but not `Kuwait` because it must be in the same order).

This ranking seems to make sense in people's minds. At least it does in mine. Feedback welcome!


## Getting Started

### Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and should
be installed as one of your project's `dependencies`:

```
npm install --save match-sorter
```

### Usage

```javascript
const matchSorter = require('match-sorter')
// ES6 imports work too
// Also available in global environment via `matchSorter` global
const list = ['hi', 'hey', 'hello', 'sup', 'yo']
matchSorter(list, 'h') // ['hi', 'hey', 'hello']
matchSorter(list, 'y') // ['yo', 'hey']
matchSorter(list, 'z') // []
```

## Advanced options

### keys: `[string]`

_Default: `undefined`_

By default it just uses the value itself as above. Passing an array tells match-sorter which keys to use for the ranking.

```javascript
const objList = [
  {name: 'Janice', color: 'Green'},
  {name: 'Fred', color: 'Orange'},
  {name: 'George', color: 'Blue'},
  {name: 'Jen', color: 'Red'},
]
matchSorter(objList, 'g', {keys: ['name', 'color']})
// [{name: 'George', color: 'Blue'}, {name: 'Janice', color: 'Green'}]

matchSorter(objList, 're', {keys: ['color', 'name']})
// [{name: 'Jen', color: 'Red'}, {name: 'Janice', color: 'Green'}, {name: 'Fred', color: 'Orange'}]
```

__Array of values__: When the specified key matches an array of values, the best match from the values of in the array is going to be used for the ranking.

```javascript
const iceCreamYum = [
  {favoriteIceCream: ['mint', 'chocolate']},
  {favoriteIceCream: ['candy cane', 'brownie']},
  {favoriteIceCream: ['birthday cake', 'rocky road', 'strawberry']},
]
matchSorter(iceCreamYum, 'cc', {keys: ['favoriteIceCream']})
// [{favoriteIceCream: ['candy cane', 'brownie']}, {favoriteIceCream: ['mint', 'chocolate']}]
```

__Nested Keys__: You can specify nested keys using dot-notation.

```javascript
const nestedObjList = [
  {name: {first: 'Janice'}},
  {name: {first: 'Fred'}},
  {name: {first: 'George'}},
  {name: {first: 'Jen'}},
]
matchSorter(nestedObjList, 'j', {keys: ['name.first']})
// [{name: {first: 'Janice'}}, {name: {first: 'Jen'}}]
```

__Property Callbacks__: Alternatively, you may also pass in a callback function that resolves the value of the key(s) you wish to match on. This is especially useful when interfacing with libraries such as Immutable.js

```javascript
const list = [
  {name: 'Janice'},
  {name: 'Fred'},
  {name: 'George'},
  {name: 'Jen'},
]
matchSorter(list, 'j', {keys: [(item) => item.name]})
// [{name: 'Janice'}, {name: 'Jen'}]
```

### threshold: `number`

_Default: `MATCHES`_

Thresholds can be used to specify the criteria used to rank the results.
Available thresholds (from top to bottom) are:
 * CASE_SENSITIVE_EQUAL
 * EQUAL
 * STARTS_WITH
 * WORD_STARTS_WITH
 * CONTAINS
 * ACRONYM
 * MATCHES _(default value)_
 * NO_MATCH

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
const thingsWithDiacritics = ['jalapeño', 'à la carte', 'café', 'papier-mâché', 'à la mode']
matchSorter(thingsWithDiacritics, 'aa')
// ['jalapeño', 'à la carte', 'papier-mâché', 'à la mode']

matchSorter(thingsWithDiacritics, 'aa', {keepDiacritics: true})
// ['jalapeño', 'à la carte']

matchSorter(thingsWithDiacritics, 'à', {keepDiacritics: true})
// ['à la carte', 'à la mode']
```

## Using ES6?

In the examples above, we're using CommonJS. If you're using ES6 modules, then you can do:

`import matchSorter, {rankings} from 'match-sorter'`

## Inspiration

Actually, most of this code was extracted from the _very first_ library I ever wrote: [genie][genie]!

## Other Solutions

You might try [Fuse.js](https://github.com/krisk/Fuse). It uses advanced math fanciness to get the closest match. Unfortunately what's "closest" doesn't always really make sense. So I extracted this from [genie][genie].

## Contributors

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;"/><br /><sub>Kent C. Dodds</sub>](https://kentcdodds.com)<br />[💻](https://github.com/kentcdodds/match-sorter/commits?author=kentcdodds) [📖](https://github.com/kentcdodds/match-sorter/commits?author=kentcdodds) 🚇 [⚠️](https://github.com/kentcdodds/match-sorter/commits?author=kentcdodds) 👀 | [<img src="https://avatars.githubusercontent.com/u/8263298?v=3" width="100px;"/><br /><sub>Conor Hastings</sub>](http://conorhastings.com)<br />[💻](https://github.com/kentcdodds/match-sorter/commits?author=conorhastings) [📖](https://github.com/kentcdodds/match-sorter/commits?author=conorhastings) [⚠️](https://github.com/kentcdodds/match-sorter/commits?author=conorhastings) 👀 | [<img src="https://avatars.githubusercontent.com/u/574806?v=3" width="100px;"/><br /><sub>Rogelio Guzman</sub>](https://github.com/rogeliog)<br />[📖](https://github.com/kentcdodds/match-sorter/commits?author=rogeliog) | [<img src="https://avatars.githubusercontent.com/u/1416436?v=3" width="100px;"/><br /><sub>Claudéric Demers</sub>](http://ced.io)<br />[💻](https://github.com/kentcdodds/match-sorter/commits?author=clauderic) [📖](https://github.com/kentcdodds/match-sorter/commits?author=clauderic) [⚠️](https://github.com/kentcdodds/match-sorter/commits?author=clauderic) |
| :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification. Contributions of any kind welcome!

## LICENSE

MIT

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/kentcdodds/match-sorter.svg?style=flat-square
[build]: https://travis-ci.org/kentcdodds/match-sorter
[coverage-badge]: https://img.shields.io/codecov/c/github/kentcdodds/match-sorter.svg?style=flat-square
[coverage]: https://codecov.io/github/kentcdodds/match-sorter
[dependencyci-badge]: https://dependencyci.com/github/kentcdodds/match-sorter/badge?style=flat-square
[dependencyci]: https://dependencyci.com/github/kentcdodds/match-sorter
[version-badge]: https://img.shields.io/npm/v/match-sorter.svg?style=flat-square
[package]: https://www.npmjs.com/package/match-sorter
[downloads-badge]: https://img.shields.io/npm/dm/match-sorter.svg?style=flat-square
[npm-stat]: http://npm-stat.com/charts.html?package=match-sorter&from=2016-04-01
[license-badge]: https://img.shields.io/npm/l/match-sorter.svg?style=flat-square
[license]: https://github.com/kentcdodds/match-sorter/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[donate-badge]: https://img.shields.io/badge/$-support-green.svg?style=flat-square
[donate]: http://kcd.im/donate
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/kentcdodds/match-sorter/blob/master/other/CODE_OF_CONDUCT.md
[roadmap-badge]: https://img.shields.io/badge/%F0%9F%93%94-roadmap-CD9523.svg?style=flat-square
[roadmap]: https://github.com/kentcdodds/match-sorter/blob/master/other/ROADMAP.md
[examples-badge]: https://img.shields.io/badge/%F0%9F%92%A1-examples-8C8E93.svg?style=flat-square
[examples]: https://github.com/kentcdodds/match-sorter/blob/master/other/EXAMPLES.md
[github-watch-badge]: https://img.shields.io/github/watchers/kentcdodds/match-sorter.svg?style=social
[github-watch]: https://github.com/kentcdodds/match-sorter/watchers
[github-star-badge]: https://img.shields.io/github/stars/kentcdodds/match-sorter.svg?style=social
[github-star]: https://github.com/kentcdodds/match-sorter/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20match-sorter!%20https://github.com/kentcdodds/match-sorter%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/kentcdodds/match-sorter.svg?style=social
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
[genie]: https://github.com/kentcdodds/genie
