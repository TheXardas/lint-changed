# lint-changed [![Build Status](https://travis-ci.org/TheXardas/lint-changed.svg?branch=master)](https://travis-ci.org/okonet/lint-staged) [![npm version](https://badge.fury.io/js/lint-staged.svg)](https://badge.fury.io/js/lint-changed)

Run linters against changed git files and don't let :poop: slip into your code base!

## Credit

This repository is almost complete copy of Andrey's (@okonet) lint-staged repo
https://github.com/okonet/lint-staged

The only difference - is that this package also lints files, that were modified, but not yet added to commit.
Which is realized by using changed-git-files, instead of staged-git-files package.

This makes it useful when you want to lint your files before even trying to commit.
