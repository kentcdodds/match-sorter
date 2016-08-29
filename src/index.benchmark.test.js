import test from 'ava'
import suite from 'chuhai'
import matchSorter from './'

test('baseline', t => {
  return suite('baseline', s => {
    s.set('maxTime', 0.01)
    s.set('minSamples', 10)

    let result

    s.cycle(() => {
      t.deepEqual(result, [])
    })

    s.bench('passing empty array', () => {
      result = matchSorter([])
    })
  })
})
