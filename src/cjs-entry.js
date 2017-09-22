import * as libStar from './'

const lib = libStar.default

Object.assign(
  lib,
  Object.keys(libStar).reduce((e, prop) => {
    if (prop !== 'default') {
      // eslint-disable-next-line import/namespace
      e[prop] = libStar[prop]
    }
    return e
  }, {}),
)

export default lib
