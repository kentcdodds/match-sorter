import {matchSorter, rankings, MatchSorterOptions} from '../'

type TestCase = {
  input: [Array<unknown>, string, MatchSorterOptions?]
  output: Array<unknown>
  only?: boolean
  skip?: boolean
}

const tests: Record<string, TestCase> = {
  'returns an empty array with a string that matches no items': {
    input: [['Chakotay', 'Charzard'], 'nomatch'],
    output: [],
  },
  'returns the items that match': {
    input: [['Chakotay', 'Brunt', 'Charzard'], 'Ch'],
    output: ['Chakotay', 'Charzard'],
  },
  'returns items that match in the best order': {
    input: [
      [
        'The Tail of Two Cities 1', // acronym
        'tTOtc', // equal
        'ttotc', // case-sensitive-equal
        'The 1-ttotc-2 container', // contains
        'The Tail of Forty Cities', // match
        'The Tail of Two Cities', // acronym2
        'kebab-ttotc-case', // case string
        'Word starts with ttotc-first right?', // wordStartsWith
        'The Tail of Fifty Cities', // match2
        'no match', // no match
        'The second 3-ttotc-4 container', // contains2
        'ttotc-starts with', // startsWith
        'Another word starts with ttotc-second, super!', // wordStartsWith2
        'ttotc-2nd-starts with', // startsWith2
        'TTotc', // equal2,
      ],
      'ttotc',
    ],
    output: [
      'ttotc', // case-sensitive-equal
      'tTOtc', // equal
      'TTotc', // equal2
      'ttotc-2nd-starts with', // startsWith
      'ttotc-starts with', // startsWith2
      'Another word starts with ttotc-second, super!', // wordStartsWith
      'Word starts with ttotc-first right?', // wordStartsWith2
      'kebab-ttotc-case', // case string
      'The 1-ttotc-2 container', // contains
      'The second 3-ttotc-4 container', // contains2
      'The Tail of Two Cities', // acronym
      'The Tail of Two Cities 1', // acronym2
      'The Tail of Fifty Cities', // match
      'The Tail of Forty Cities', // match2
    ],
  },
  'no match for single character inputs that are not equal': {
    input: [['abc'], 'd'],
    output: [],
  },
  'can handle objects when specifying a key': {
    input: [
      [{name: 'baz'}, {name: 'bat'}, {name: 'foo'}],
      'ba',
      {keys: ['name']},
    ],
    output: [{name: 'bat'}, {name: 'baz'}],
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
      {name: 'bag', reverse: 'gab'},
      {name: 'bat', reverse: 'tab'},
      {name: 'baz', reverse: 'zab'},
    ],
  },
  'with multiple keys specified, all other things being equal, it prioritizes key index over alphabetizing': {
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
  'can handle the number 0 as a property value': {
    input: [
      [
        {name: 'A', age: 0},
        {name: 'B', age: 1},
        {name: 'C', age: 2},
        {name: 'D', age: 3},
      ],
      '0',
      {keys: ['age']},
    ],
    output: [{name: 'A', age: 0}],
  },
  'can handle object with nested keys': {
    input: [
      [
        {name: {first: 'baz'}},
        {name: {first: 'bat'}},
        {name: {first: 'foo'}},
        {name: null},
        {},
        null,
      ],
      'ba',
      {keys: ['name.first']},
    ],
    output: [{name: {first: 'bat'}}, {name: {first: 'baz'}}],
  },
  'can handle object with an array of values with nested keys with a specific index': {
    input: [
      [
        {aliases: [{name: {first: 'baz'}},{name: {first: 'foo'}},{name: null}]},
        {aliases: [{name: {first: 'foo'}},{name: {first: 'bat'}},null]},
        {aliases: [{name: {first: 'foo'}},{name: {first: 'foo'}}]},
        {aliases: null},
        {},
        null,
      ],
      'ba',
      {keys: ['aliases.0.name.first']},
    ],
    output: [{aliases: [{name: {first: 'baz'}},{name: {first: 'foo'}},{name: null}]}],
  },
  'can handle object with an array of values with nested keys with a wildcard': {
    input: [
      [
        {aliases: [{name: {first: 'baz'}},{name: {first: 'foo'}},{name: null}]},
        {aliases: [{name: {first: 'foo'}},{name: {first: 'bat'}},null]},
        {aliases: [{name: {first: 'foo'}},{name: {first: 'foo'}}]},
        {aliases: null},
        {},
        null,
      ],
      'ba',
      {keys: ['aliases.*.name.first']},
    ],
    output: [{aliases: [{name: {first: 'baz'}},{name: {first: 'foo'}},{name: null}]}, {aliases: [{name: {first: 'foo'}},{name: {first: 'bat'}},null]}],
  },
  'can handle property callback': {
    input: [
      [{name: {first: 'baz'}}, {name: {first: 'bat'}}, {name: {first: 'foo'}}],
      'ba',
      // @ts-expect-error I don't know how to make this typed properly
      {keys: [item => item.name.first]},
    ],
    output: [{name: {first: 'bat'}}, {name: {first: 'baz'}}],
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
  'can handle keys that are an array of values with a wildcard': {
    input: [
      [
        {favoriteIceCream: ['mint', 'chocolate']},
        {favoriteIceCream: ['candy cane', 'brownie']},
        {favoriteIceCream: ['birthday cake', 'rocky road', 'strawberry']},
      ],
      'cc',
      {keys: ['favoriteIceCream.*']},
    ],
    output: [
      {favoriteIceCream: ['candy cane', 'brownie']},
      {favoriteIceCream: ['mint', 'chocolate']},
    ],
  },
  'can handle nested keys that are an array of values': {
    input: [
      [
        {favorite: {iceCream: ['mint', 'chocolate']}},
        {favorite: {iceCream: ['candy cane', 'brownie']}},
        {favorite: {iceCream: ['birthday cake', 'rocky road', 'strawberry']}},
      ],
      'cc',
      {keys: ['favorite.iceCream']},
    ],
    output: [
      {favorite: {iceCream: ['candy cane', 'brownie']}},
      {favorite: {iceCream: ['mint', 'chocolate']}},
    ],
  },
  'can handle nested keys that are an array of values with a wildcard': {
    input: [
      [
        {favorite: {iceCream: ['mint', 'chocolate']}},
        {favorite: {iceCream: ['candy cane', 'brownie']}},
        {favorite: {iceCream: ['birthday cake', 'rocky road', 'strawberry']}},
      ],
      'cc',
      {keys: ['favorite.iceCream.*']},
    ],
    output: [
      {favorite: {iceCream: ['candy cane', 'brownie']}},
      {favorite: {iceCream: ['mint', 'chocolate']}},
    ],
  },
  'can handle nested keys that are an array of objects with a single wildcard': {
    input: [
      [
        {favorite: {iceCream: [{tastes: ['vanilla', 'mint']}, {tastes: ['vanilla', 'chocolate']}]}},
        {favorite: {iceCream: [{tastes: ['vanilla', 'candy cane']}, {tastes: ['vanilla', 'brownie']}]}},
        {favorite: {iceCream: [{tastes: ['vanilla', 'birthday cake']}, {tastes: ['vanilla', 'rocky road']}, {tastes: ['strawberry']}]}},
      ],
      'cc',
      {keys: ['favorite.iceCream.*.tastes']},
    ],
    output: [
      {favorite: {iceCream: [{tastes:['vanilla', 'candy cane']}, {tastes:['vanilla', 'brownie']}]}},
      {favorite: {iceCream: [{tastes:['vanilla', 'mint']}, {tastes:['vanilla', 'chocolate']}]}},
    ],
  },
  'can handle nested keys that are an array of objects with two wildcards': {
    input: [
      [
        {favorite: {iceCream: [{tastes: ['vanilla', 'mint']}, {tastes: ['vanilla', 'chocolate']}]}},
        {favorite: {iceCream: [{tastes: ['vanilla', 'candy cane']}, {tastes: ['vanilla', 'brownie']}]}},
        {favorite: {iceCream: [{tastes: ['vanilla', 'birthday cake']}, {tastes: ['vanilla', 'rocky road']}, {tastes: ['strawberry']}]}},
      ],
      'cc',
      {keys: ['favorite.iceCream.*.tastes.*']},
    ],
    output: [
      {favorite: {iceCream: [{tastes:['vanilla', 'candy cane']}, {tastes:['vanilla', 'brownie']}]}},
      {favorite: {iceCream: [{tastes:['vanilla', 'mint']}, {tastes:['vanilla', 'chocolate']}]}},
    ],
  },
  'can handle keys with a maxRanking': {
    input: [
      [
        {tea: 'Earl Grey', alias: 'A'},
        {tea: 'Assam', alias: 'B'},
        {tea: 'Black', alias: 'C'},
      ],
      'A',
      {
        keys: ['tea', {maxRanking: rankings.STARTS_WITH, key: 'alias'}],
      },
    ],
    // without maxRanking, Earl Grey would come first because the alias "A" would be CASE_SENSITIVE_EQUAL
    // `tea` key comes before `alias` key, so Assam comes first even though both match as STARTS_WITH
    output: [
      {tea: 'Assam', alias: 'B'},
      {tea: 'Earl Grey', alias: 'A'},
      {tea: 'Black', alias: 'C'},
    ],
  },
  'can handle keys with a minRanking': {
    input: [
      [
        {tea: 'Milk', alias: 'moo'},
        {tea: 'Oolong', alias: 'B'},
        {tea: 'Green', alias: 'C'},
      ],
      'oo',
      {keys: ['tea', {minRanking: rankings.EQUAL, key: 'alias'}]},
    ],
    // minRanking bumps Milk up to EQUAL from CONTAINS (alias)
    // Oolong matches as STARTS_WITH
    // Green is missing due to no match
    output: [
      {tea: 'Milk', alias: 'moo'},
      {tea: 'Oolong', alias: 'B'},
    ],
  },
  'when using arrays of values, when things are equal, the one with the higher key index wins': {
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
    output: ['apple', 'grape', 'banana', 'orange'],
  },
  'when providing a rank threshold of EQUAL, it returns only the items that are equal': {
    input: [
      ['google', 'airbnb', 'apple', 'apply', 'app'],
      'app',
      {threshold: rankings.EQUAL},
    ],
    output: ['app'],
  },
  'when providing a rank threshold of CASE_SENSITIVE_EQUAL, it returns only case-sensitive equal matches': {
    input: [
      ['google', 'airbnb', 'apple', 'apply', 'app', 'aPp', 'App'],
      'app',
      {threshold: rankings.CASE_SENSITIVE_EQUAL},
    ],
    output: ['app'],
  },
  'when providing a rank threshold of WORD_STARTS_WITH, it returns only the items that are equal': {
    input: [
      ['fiji apple', 'google', 'app', 'crabapple', 'apple', 'apply'],
      'app',
      {threshold: rankings.WORD_STARTS_WITH},
    ],
    output: ['app', 'apple', 'apply', 'fiji apple'],
  },
  'when providing a rank threshold of ACRONYM, it returns only the items that meet the rank': {
    input: [
      ['apple', 'atop', 'alpaca', 'vamped'],
      'ap',
      {threshold: rankings.ACRONYM},
    ],
    output: ['apple'],
  },
  'defaults to ignore diacritics': {
    input: [
      ['jalapeño', 'à la carte', 'café', 'papier-mâché', 'à la mode'],
      'aa',
    ],
    output: ['jalapeño', 'à la carte', 'à la mode', 'papier-mâché'],
  },
  'takes diacritics in account when keepDiacritics specified as true': {
    input: [
      ['jalapeño', 'à la carte', 'papier-mâché', 'à la mode'],
      'aa',
      {keepDiacritics: true},
    ],
    output: ['jalapeño', 'à la carte'],
  },
  'sorts items based on how closely they match': {
    input: [
      ['Antigua and Barbuda', 'India', 'Bosnia and Herzegovina', 'Indonesia'],
      'Ina',
    ],
    output: [
      // these are sorted based on how closes their letters are to one another based on the input
      //    contains              2           6               8
      'Bosnia and Herzegovina',
      'India',
      'Indonesia',
      'Antigua and Barbuda',
      // though, technically, `India` comes up first because it matches with STARTS_WITH...
    ],
  },
  'sort when search value is absent': {
    input: [
      [
        {tea: 'Milk', alias: 'moo'},
        {tea: 'Oolong', alias: 'B'},
        {tea: 'Green', alias: 'C'},
      ],
      '',
      {keys: ['tea']},
    ],
    output: [
      {tea: 'Green', alias: 'C'},
      {tea: 'Milk', alias: 'moo'},
      {tea: 'Oolong', alias: 'B'},
    ],
  },
  'only match when key meets threshold': {
    input: [
      [
        {name: 'Fred', color: 'Orange'},
        {name: 'Jen', color: 'Red'},
      ],
      'ed',
      {
        keys: [{threshold: rankings.STARTS_WITH, key: 'name'}, 'color'],
      },
    ],
    output: [{name: 'Jen', color: 'Red'}],
  },
  'should match when key threshold is lower than the default threshold': {
    input: [
      [
        {name: 'Fred', color: 'Orange'},
        {name: 'Jen', color: 'Red'},
      ],
      'ed',
      {
        keys: ['name', {threshold: rankings.CONTAINS, key: 'color'}],
        threshold: rankings.STARTS_WITH,
      },
    ],
    output: [{name: 'Jen', color: 'Red'}],
  },
  'case insensitive cyrillic match': {
    input: [['Привет', 'Лед'], 'л'],
    output: ['Лед'],
  },
  'should sort same ranked items alphabetically while when mixed with diacritics': {
    input: [
      [
        'jalapeño',
        'anothernodiacritics',
        'à la carte',
        'nodiacritics',
        'café',
        'papier-mâché',
        'à la mode',
      ],
      'z',
      {
        threshold: rankings.NO_MATCH,
      },
    ],
    output: [
      'à la carte',
      'à la mode',
      'anothernodiacritics',
      'café',
      'jalapeño',
      'nodiacritics',
      'papier-mâché',
    ],
  },
  'returns objects in their original order': {
    input: [
      [
        {country: 'Italy', counter: 3},
        {country: 'Italy', counter: 2},
        {country: 'Italy', counter: 1},
      ],
      'Italy',
      {keys: ['country', 'counter']},
    ],
    output: [
      {country: 'Italy', counter: 3},
      {country: 'Italy', counter: 2},
      {country: 'Italy', counter: 1},
    ],
  },
  'supports a custom baseSort function for tie-breakers': {
    input: [
      ['appl', 'C apple', 'B apple', 'A apple', 'app', 'applebutter'],
      'apple',
      {baseSort: (a, b) => (a.index < b.index ? -1 : 1)},
    ],
    output: ['applebutter', 'C apple', 'B apple', 'A apple'],
  },
  'sorts simple items alphabetically': {
    input: [[`a'd`, 'a-c', 'a_b', 'a a'], ''],
    output: ['a a', 'a_b', 'a-c', `a'd`],
  },
  'can work around non space separated words': {
    input: [
      [
        {name: 'Janice_Kurtis'},
        {name: 'Fred_Mertz'},
        {name: 'George_Foreman'},
        {name: 'Jen_Smith'},
      ],
      'js',
      // @ts-expect-error I don't know how to make this typed properly
      {keys: [item => item.name.replace(/_/g, ' ')]},
    ],
    output: [{name: 'Jen_Smith'}, {name: 'Janice_Kurtis'}],
  },
}

for (const [
  title,
  {input, output, only = false, skip = false},
] of Object.entries<TestCase>(tests)) {
  const testFn = () => expect(matchSorter(...input)).toEqual(output)

  if (only) {
    test.only(title, testFn)
  } else if (skip) {
    test.skip(title, testFn)
  } else {
    test(title, testFn)
  }
}

/*
eslint
  jest/valid-title: "off",
  jest/no-disabled-tests: "off",
  jest/no-focused-tests: "off",
  @typescript-eslint/no-unsafe-call: "off",
  @typescript-eslint/no-unsafe-member-access: "off"
*/
