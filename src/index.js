/* global process */
/* eslint no-console: 0 */

'use strict'

const path = require('path')
const cgf = require('changed-git-files')
const appRoot = require('app-root-path')
const Listr = require('listr')
const cosmiconfig = require('cosmiconfig')

const packageJson = require(appRoot.resolve('package.json')) // eslint-disable-line
const runScript = require('./runScript')
const generateTasks = require('./generateTasks')

// Force colors for packages that depend on https://www.npmjs.com/package/supports-color
// but do this only in TTY mode
if (process.stdout.isTTY) {
    process.env.FORCE_COLOR = true
}

cosmiconfig('lint-changed', {
    rc: '.lintchangedrc',
    rcExtensions: true
})
    .then((result) => {
        // result.config is the parsed configuration object
        // result.filepath is the path to the config file that was found
        const config = result.config
        const verbose = config.verbose
        // Output config in verbose mode
        if (verbose) console.log(config)
        const concurrent = typeof config.concurrent !== 'undefined' ? config.concurrent : true
        const renderer = verbose ? 'verbose' : 'update'
        const gitDir = config.gitDir ? path.resolve(config.gitDir) : process.cwd()
        cgf.cwd = gitDir

        cgf('ACM', (err, files) => {
            if (err) {
                console.error(err)
            }

            const resolvedFiles = {}
            files.forEach((file) => {
                const absolute = path.resolve(gitDir, file.filename)
                const relative = path.relative(gitDir, absolute)
                resolvedFiles[relative] = absolute
            })

            const tasks = generateTasks(config, resolvedFiles)
                .map(task => ({
                    title: `Running tasks for ${ task.pattern }`,
                    task: () => (
                        new Listr(
                            runScript(
                                task.commands,
                                task.fileList,
                                packageJson,
                                { gitDir, verbose }
                            ), {
                                // In sub-tasks we don't want to run concurrently
                                // and we want to abort on errors
                                concurrent: false,
                                exitOnError: true
                            }
                        )
                    ),
                    skip: () => {
                        if (task.fileList.length === 0) {
                            return `No changed files match ${ task.pattern }`
                        }
                        return false
                    }
                }))


            if (tasks.length) {
                new Listr(tasks, {
                    concurrent,
                    renderer,
                    exitOnError: !concurrent // Wait for all errors when running concurrently
                })
                    .run()
                    .catch((error) => {
                        if (Array.isArray(error.errors)) {
                            error.errors.forEach((lintError) => {
                                console.error(lintError.message)
                            })
                        } else {
                            console.log(error.message)
                        }
                        process.exit(1)
                    })
            }
        })
    })
    .catch((parsingError) => {
        console.error(`Could not parse lint-changed config.
Make sure you have created it. See https://github.com/okonet/lint-staged#readme.

${ parsingError }
`)
        process.exit(1)
    })
