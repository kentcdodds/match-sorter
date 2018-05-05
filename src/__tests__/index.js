// have to disable eslint for the next line because we have to
// do weird things to make things work with UMD
// eslint-disable-next-line import/default,import/named
import matchSorter, {rankings} from '../'

const tests = {
  'returns an empty array with a string that is too long': {
    input: [['Chakotay', 'Charzard'], 'JonathanJonathan'],
    output: [],
  },
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
        'TheTailOfTwoCities', // case acronym
        'The Tail of Fifty Cities', // match2
        'no match', // no match
        'The second 3-ttotc-4 container', // contains2
        'ttotc-starts with', // startsWith
        'the_tail_of_two_cities', // case acronym2
        'Another word starts with ttotc-second, super!', // wordStartsWith2
        'ttotc-2nd-starts with', // startsWith2
        'TTotc', // equal2,
        'PascalTtotcCase', // case string
      ],
      'ttotc',
    ],
    output: [
      'ttotc', // case-sensitive-equal
      'tTOtc', // equal
      'TTotc', // equal2
      'ttotc-starts with', // startsWith
      'ttotc-2nd-starts with', // startsWith2
      'Word starts with ttotc-first right?', // wordStartsWith
      'Another word starts with ttotc-second, super!', // wordStartsWith2
      'PascalTtotcCase', // case string
      'kebab-ttotc-case', // case string
      'TheTailOfTwoCities', // case acronym
      'the_tail_of_two_cities', // case acronym2
      'The 1-ttotc-2 container', // contains
      'The second 3-ttotc-4 container', // contains2
      'The Tail of Two Cities 1', // acronym
      'The Tail of Two Cities', // acronym2
      'The Tail of Forty Cities', // match
      'The Tail of Fifty Cities', // match2
    ],
  },
  'sorts equally ranking items in the same order in which they appeared in the original array': {
    input: [['Foo1', 'Bar', 'Foo2'], 'foo'],
    output: ['Foo1', 'Foo2'],
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
  'can handle objected with nested keys': {
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
    output: [{name: {first: 'baz'}}, {name: {first: 'bat'}}],
  },
  'can handle property callback': {
    input: [
      [{name: {first: 'baz'}}, {name: {first: 'bat'}}, {name: {first: 'foo'}}],
      'ba',
      {keys: [item => item.name.first]},
    ],
    output: [{name: {first: 'baz'}}, {name: {first: 'bat'}}],
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
    output: [{tea: 'Milk', alias: 'moo'}, {tea: 'Oolong', alias: 'B'}],
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
    output: ['apple', 'grape', 'orange', 'banana'],
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
  'takes camelCase, PascalCase, kebab-case, and snake_case into account': {
    input: [
      [
        'somethingcontainedintheword', // if this is last, then we're good
        'camelCaseContainedInTheWord',
        'PascalCaseContainedInTheWord',
        'kebab-case-contained-in-the-word',
        'snake_case_contained_in_the_word',
      ],
      'cont',
    ],
    output: [
      'camelCaseContainedInTheWord',
      'PascalCaseContainedInTheWord',
      'kebab-case-contained-in-the-word',
      'snake_case_contained_in_the_word',
      'somethingcontainedintheword',
    ],
  },
  'takes startsWith and case into account': {
    input: [
      [
        'somethingcontainedintheword',
        'camelCaseContainedInTheWord',
        'PascalCaseContainedInTheWord',
        'kebab-case-contained-in-the-word',
        'snake_case_contained_in_the_word',
      ],
      's',
    ],
    output: [
      'snake_case_contained_in_the_word',
      'somethingcontainedintheword',
      'camelCaseContainedInTheWord',
      'PascalCaseContainedInTheWord',
      'kebab-case-contained-in-the-word',
    ],
  },
  'takes case into account and ignores fake case': {
    input: [
      [
        'startingWith_s',
        'somethingcontainedintheword',
        'camelCaseContainedInTheWord',
        'PascalCaseContainedInTheWord',
        'kebab-case-contained-in-the-word',
        'snake_case_contained_in_the_word',
        'fakeCase_one',
        'fake_case-two',
        'fake_caseThree',
      ],
      's',
    ],
    output: [
      'snake_case_contained_in_the_word',
      'startingWith_s',
      'somethingcontainedintheword',
      'camelCaseContainedInTheWord',
      'PascalCaseContainedInTheWord',
      'kebab-case-contained-in-the-word',
      'fakeCase_one',
      'fake_case-two',
      'fake_caseThree',
    ],
  },
  'takes case and acronym into account': {
    input: [
      [
        'superduperfile',
        'super-duper-file',
        'super_duper_file',
        'superDuperFile',
        'SuperDuperFile',
      ],
      'sdf',
    ],
    output: [
      'superDuperFile',
      'SuperDuperFile',
      'super-duper-file',
      'super_duper_file',
      'superduperfile',
    ],
  },
  'skip matching when no search value is absent': {
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
      {tea: 'Milk', alias: 'moo'},
      {tea: 'Oolong', alias: 'B'},
      {tea: 'Green', alias: 'C'},
    ],
  },
}

Object.keys(tests).forEach(title => {
  const {input, output, only, skip} = tests[title]
  if (only) {
    // eslint-disable-next-line
    test.only(title, testFn)
  } else if (skip) {
    // eslint-disable-next-line
    test.skip(title, testFn)
  } else {
    test(title, testFn)
  }

  function testFn() {
    expect(matchSorter(...input)).toEqual(output)
  }
})
