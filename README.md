# Global OWScript

OWS is a global NPM module built for [OWScript](https://github.com/adapap/OWScript). It adds the ability to generate projects, update OWScript, compile (on demand and on file changes), and more as time goes on.

## Installation

Installation is as easy as:

```text
npm install owscript -g
```

## Generating a Project

### Command/Aliases

- `generate`
- `gen`
- `g`
- `init`
- `i`
- `new`
- `n`

### Usage

```text
ows generate
```

This will generate a project in the current directory.

```text
ows generate [folder] [path?]
```

This will generate a project inside a folder name that's specified. If the folder exists, with contents inside, it will confirm the action before removing the entire folder and recreating it. If it doesn't exist, it will create it.

If the path is specified, it will attempt to do all of the above at that path (either relative to the current working directory, or absolute)

After that, it will ask you a variety of questions for the process to complete. Then all you have to do is open the project in your favorite editor (we suggest VSCode with the [official extension](https://marketplace.visualstudio.com/items?itemName=adapap.owscript)) and start creating in `src/index.owpy`.

## Compiling

### Command/Aliases

- `compile`
- `c`

### Usage
Just navigate to a OWScript project directory and have a properly configured `owscript.config.json` and run:

```text
ows compile
```

It will take care of the rest!

### Watching for Changes

There's also a command (`ows watch` / `ows w`) which, essentially, works the same as `compile` except it watches the project directory for any changes and compiles as you go. This works very well for those who don't want to constantly run a compile command and just want to be able to let it run in the background and only switch to it [the console] to check for errors.

## Git submodules? What?

If you answered yes for git, you'd probably notice the new `.gitmodules` file. A lot of people don't notice it. There's a pretty nifty guide, from [Chris Jean](https://twitter.com/chrisjean), that goes over submodules here: [Git Submodules: Adding, Using, Removing, Updating](https://chrisjean.com/git-submodules-adding-using-removing-and-updating/)

We use git submodules for everything, include library files like [Overwatch Zone's Core Module](https://github.com/overwatchzone/ows-module-core). This eliminates the need for custom package manager, and allows you to retain control over what branch, commits, etc you use for your project. It also allows you to, in most cases, on wherever your project is hosted view the submodule on that commit directly...so you never have to worry about digging through releases.
