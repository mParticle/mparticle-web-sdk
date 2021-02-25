# Contributing

Thanks for contributing! Please read this document to follow our conventions for contributing to the mParticle SDK.

## Setting Up

-   Fork the repository and then clone down your fork
-   Commit your code per the conventions below, and PR into the mParticle SDK `master` branch
-   Your PR title will be checked automatically against the below convention (view the commit history to see examples of a proper commit/PR title). If it fails, you must update your title.
-   Our engineers will work with you to get your code change implemented once a PR is up

## PR Title and Commit Convention

PR titles should follow [conventional commit standards](https://www.conventionalcommits.org/). This helps automate the release process.

The standard format for commit messages is as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

The following lists the different `types` allowed in the commit message:

-   feat: A new feature (automatic minor release)
-   fix: A bug fix (automatic patch release)
-   docs: Documentation only changes
-   style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
-   refactor: A code change that neither fixes a bug nor adds a feature
-   perf: A code change that improves performance
-   test: Adding missing or correcting existing tests
-   chore: Changes that don't modify src or test files, such as automatic documentation generation, or building latest assets
-   ci: Changes to CI configuration files/scripts
-   revert: Revert commit
-   build: Changes that affect the build system or other dependencies

In the footer, if there is a breaking change, start your footer with `BREAKING CHANGE:` followed by a description.

## Running Tests

```bash
$ npm install
$ npm run test // builds mparticle bundles and runs tests
```

There are additional scripts that may improve your development experience:
```bash
$ npm run watch // watches src/ files and continuously rebuilds bundles as changes are made
$ npm run watch:tests // watches test/ files and continuously rebuilds test bundles as changes are made
$ npm run test:debug // opens a browser so you can step through mParticle and test code
```