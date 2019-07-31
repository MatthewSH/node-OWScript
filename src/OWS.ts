import * as yargs from "yargs"
import { Argv } from "yargs"
import { Generator } from "./Generator"

yargs
  .command(["generate <name> [path]", "gen", "g"], "the project generation command", (yargs: Argv): any => {
    yargs
      .positional("name", {
        describe: "the name of the project",
        type: "string",
        default: null,
      })
      .positional("path", {
        describe: "the path, if outside current working directory, to create the project",
        type: "string"
      })
  })
  .help()
  .argv