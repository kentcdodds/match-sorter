import {rollup} from 'rollup' // eslint-disable-line
import rollupBabel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import uglify from 'rollup-plugin-uglify'

process.env.BABEL_ENV = 'rollup' // so babel will be configured to not transpile modules
const minify = process.argv.indexOf('--match-sorter-minify') !== -1
const filename = minify ? 'match-sorter.min.js' : 'match-sorter.js'

export default {
  entry: 'src/index.js',
  dest: `dist/umd/${filename}`,
  exports: 'none',
  plugins: [
    nodeResolve({jsnext: true, main: true}),
    commonjs({include: 'node_modules/**'}),
    rollupBabel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [['es2015', {modules: false}], 'stage-2'],
    }),
    minify ? uglify() : null,
  ].filter(i => !!i),
}
