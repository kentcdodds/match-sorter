module.exports = {
  scripts: {
    commit: {
      description: 'This uses commitizen to help us generate well formatted commit messages',
      script: 'git-cz',
    },
    test: {
      default: {
        description: `This runs jest with coverage. If we're on Travis, then we'll ignore the cache (just in case).`,
        script: `jest --coverage ${process.env.CI ? '--no-cache' : ''}`,
      },
      watch: 'jest --watch',
      build: {
        description: 'validates the built files',
        script: 'babel-node dist-test/index.js',
        watch: {
          description: 'watches the dist directory for changes and reruns test.build when it changes',
          script: watch(['dist-test/**/*.js', 'dist/**/*.js'], 'npm start -s test.build'),
        },
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
        script: 'rollup --config',
        min: {
          description: 'run the rollup build with sourcemaps',
          script: 'rollup --config --sourcemap --match-sorter-minify',
        },
      },
      watch: {
        description: 'watches the filesystem for changes and reruns the build when changes have been made',
        script: watchSrc('npm start -s build'),
      },
    },
    dev: {
      build: {
        description: 'helps while working on the module build and tests',
        script: 'p-s -p build.watch,test.build.watch',
      },
      coverage: {
        description: 'runs tests as files change in `src`',
        script: watchSrc('p-s test'),
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
      script: 'p-s -p lint,build,test && p-s test.build',
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

function watch(paths, command) {
  return `nodemon --quiet ${paths.map(p => `--watch ${p}`).join(' ')} --exec "${command}"`
}

function watchSrc(command) {
  return watch(['src/**/*.js'], command)
}
