module.exports = {
  scripts: {
    commit: {
      description: 'This uses commitizen to help us generate well formatted commit messages',
      script: 'git-cz',
    },
    test: {
      default: {
        description: 'Runs AVA with nyc (which is configured in package.json)',
        script: 'cross-env NODE_ENV=test nyc ava',
      },
      watch: {
        description: 'Run AVA in watch mode',
        script: 'ava -w --require babel-register',
      },
    },
    build: {
      description: 'delete the dist directory and run all builds',
      default: 'rimraf dist && p-s -p build.main,build.umd,build.umd.min',
      main: {
        description: 'transpile all source with babel',
        script: 'babel --copy-files --out-dir dist/cjs --ignore *.test.js src',
      },
      umd: {
        description: 'run the build with rollup (uses rollup.config.js)',
        script: 'cross-env rollup --config',
        min: {
          description: 'run the rollup build with sourcemaps',
          script: 'cross-env MINIFY=true rollup --config --sourcemap',
        },
      },
    },
    lint: {
      description: 'lint the entire project',
      script: 'eslint .',
    },
    reportCoverage: {
      description: 'Report coverage stats to codecov. This should be run after the `test` script',
      script: 'codecov',
    },
    release: {
      description: 'We automate releases with semantic-release. This should only be run on travis',
      script: 'semantic-release pre && npm publish && semantic-release post',
    },
    validate: {
      description: 'This runs several scripts to make sure things look good before committing or on clean install',
      script: 'p-s -p lint,build,test',
    },
    addContributor: {
      description: 'When new people contribute to the project, run this',
      script: 'all-contributors add',
    },
    generateContributors: {
      description: 'Update the badge and contributors table',
      script: 'all-contributors generate',
    },
  },
  options: {
    silent: false,
  },
}
