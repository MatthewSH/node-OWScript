import * as yargs from "yargs"
import { Argv } from "yargs"
import { Generator } from "./Generator"
import { Compiler } from "./Compiler";

yargs
  .command("$0", "the default OWS command", (): any => {}, (argv: Argv) => {
    yargs.showHelp()
  })
  .command(["generate [name] [path]", "gen", "g", "init", "i", "new", "n"], "the project generation command", (yargs: Argv): any => {
    yargs
      .positional("name", {
        describe: "the name of the project",
        type: "string",
        default: ""
      })
      .positional("path", {
        describe: "the path, if outside current working directory, to create the project",
        type: "string",
        default: ""
      })
  }, (argv: any) => {
    return new Generator(argv["name"], argv["path"])
  })
  .command(["compile", "c"], "compile the local project", (yargs: Argv): any => {}, (argv: any) => {
    return new Compiler(argv._)
  })
  .help()
  .argv