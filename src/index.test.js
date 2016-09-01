// have to disable eslint for the next line because we have to do weird things to make things work with UMD
import matchSorter, {rankings} from './' // eslint-disable-line import/default,import/named

const tests = {
  'returns an empty array with a string that is too long': {
    input: [
      ['Chakotay', 'Charzard'],
      'JonathanJonathan',
    ],
    output: [],
  },
  'returns an empty array with a string that matches no items': {
    input: [
      ['Chakotay', 'Charzard'],
      'nomatch',
    ],
    output: [],
  },
  'returns the items that match': {
    input: [
      ['Chakotay', 'Brunt', 'Charzard'],
      'Ch',
    ],
    output: ['Chakotay', 'Charzard'],
  },
  'returns items that match in the best order': {
    input: [
      [
        'The Tail of Two Cities 1', // acronym
        'tTOtc', // equal
        'The 1-ttotc-2 container', // contains
        'The Tail of Forty Cities', // match
        'The Tail of Two Cities', // acronym2
        'Word starts with ttotc-first right?', // wordStartsWith
        'The Tail of Fifty Cities', // match2
        'no match', // no match
        'The second 3-ttotc-4 container', // contains2
        'ttotc-starts with', // startsWith
        'Another word starts with ttotc-second, super!', // wordStartsWith2
        'ttotc-2nd-starts with', // startsWith2
        'TTotc', // equal2
      ],
      'ttotc',
    ],
    output: [
      'tTOtc', // equal
      'TTotc', // equal2
      'ttotc-starts with', // startsWith
      'ttotc-2nd-starts with', // startsWith2
      'Word starts with ttotc-first right?', // wordStartsWith
      'Another word starts with ttotc-second, super!', // wordStartsWith2
      'The 1-ttotc-2 container', // contains
      'The second 3-ttotc-4 container', // contains2
      'The Tail of Two Cities 1', // acronym
      'The Tail of Two Cities', // acronym2
      'The Tail of Forty Cities', // match
      'The Tail of Fifty Cities', // match2
    ],
  },
  'sorts equally ranking items in the same order in which they appeared in the original array': {
    input: [
      ['Foo1', 'Bar', 'Foo2'],
      'foo',
    ],
    output: ['Foo1', 'Foo2'],
  },
  'no match for single character inputs that are not equal': {
    input: [
      ['abc'],
      'd',
    ],
    output: [],
  },
  'can handle objects when specifying a key': {
    input: [
      [{name: 'baz'}, {name: 'bat'}, {name: 'foo'}],
      'ba',
      {keys: ['name']},
    ],
    output: [{name: 'baz'}, {name: 'bat'}],
  },
  'can handle multiple keys specified': {
    input: [
      [
        {name: 'baz', reverse: 'zab'},
        {name: 'bat', reverse: 'tab'},
        {name: 'foo', reverse: 'oof'},
        {name: 'bag', reverse: 'gab'},
      ],
      'ab',
      {keys: ['name', 'reverse']},
    ],
    output: [
      {name: 'baz', reverse: 'zab'},
      {name: 'bat', reverse: 'tab'},
      {name: 'bag', reverse: 'gab'},
    ],
  },
  'with multiple keys specified, all other things being equal, it prioritizes first keys first over index': {
    input: [
      [
        {first: 'not', second: 'not', third: 'match'},
        {first: 'not', second: 'not', third: 'not', fourth: 'match'},
        {first: 'not', second: 'match'},
        {first: 'match', second: 'not'},
      ],
      'match',
      {keys: ['first', 'second', 'third', 'fourth']},
    ],
    output: [
      {first: 'match', second: 'not'},
      {first: 'not', second: 'match'},
      {first: 'not', second: 'not', third: 'match'},
      {first: 'not', second: 'not', third: 'not', fourth: 'match'},
    ],
  },
  'can handle objected with nested keys': {
    input: [
      [
        {name: {first: 'baz'}},
        {name: {first: 'bat'}},
        {name: {first: 'foo'}},
      ],
      'ba',
      {keys: ['name.first']},
    ],
    output: [
      {name: {first: 'baz'}},
      {name: {first: 'bat'}},
    ],
  },
  'can handle keys that are an array of values': {
    input: [
      [
        {favoriteIceCream: ['mint', 'chocolate']},
        {favoriteIceCream: ['candy cane', 'brownie']},
        {favoriteIceCream: ['birthday cake', 'rocky road', 'strawberry']},
      ],
      'cc',
      {keys: ['favoriteIceCream']},
    ],
    output: [
      {favoriteIceCream: ['candy cane', 'brownie']},
      {favoriteIceCream: ['mint', 'chocolate']},
    ],
  },
  'when using arrays of values, when things are equal, the one with the higher index wins': {
    input: [
      [
        {favoriteIceCream: ['mint', 'chocolate']},
        {favoriteIceCream: ['chocolate', 'brownie']},
      ],
      'chocolate',
      {keys: ['favoriteIceCream']},
    ],
    output: [
      {favoriteIceCream: ['chocolate', 'brownie']},
      {favoriteIceCream: ['mint', 'chocolate']},
    ],
  },
  'when providing a rank threshold of NO_MATCH, it returns all of the items': {
    input: [
      ['orange', 'apple', 'grape', 'banana'],
      'ap',
      {threshold: rankings.NO_MATCH},
    ],
    output: [
      'apple', 'grape', 'orange', 'banana',
    ],
  },
  'when providing a rank threshold of EQUAL, it returns only the items that are equal': {
    input: [
      ['google', 'airbnb', 'apple', 'apply', 'app'],
      'app',
      {threshold: rankings.EQUAL},
    ],
    output: [
      'app',
    ],
  },
  'when providing a rank threshold of WORD_STARTS_WITH, it returns only the items that are equal': {
    input: [
      ['fiji apple', 'google', 'app', 'crabapple', 'apple', 'apply'],
      'app',
      {threshold: rankings.WORD_STARTS_WITH},
    ],
    output: [
      'app', 'apple', 'apply', 'fiji apple',
    ],
  },
  'defaults to ignore diacritics': {
    input: [
      ['jalapeño', 'à la carte', 'café', 'papier-mâché', 'à la mode'],
      'aa',
    ],
    output: [
      'jalapeño', 'à la carte', 'papier-mâché', 'à la mode',
    ],
  },
  'takes diacritics in account when keepDiacritics specified as true': {
    input: [
      ['jalapeño', 'à la carte', 'papier-mâché', 'à la mode'],
      'aa',
      {keepDiacritics: true},
    ],
    output: [
      'jalapeño', 'à la carte',
    ],
  },
}

Object.keys(tests).forEach(title => {
  const {input, output, only, skip} = tests[title]
  if (only) {
    fit(title, testFn)
  } else if (skip) {
    xit(title, testFn)
  } else {
    it(title, testFn)
  }

  function testFn() {
    expect(matchSorter(...input)).toEqual(output)
  }
})
