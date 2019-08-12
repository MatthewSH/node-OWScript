import * as boxen from "boxen"
import chalk from "chalk"
import * as chokidar from "chokidar"
import { exec, ExecException } from "child_process" 
import * as fs from "fs-extra"
import * as moment from 'moment'
import * as ora from "ora"
import * as path from "path"

export class Watcher {
  private spinner: ora.Ora
  private owsConfig: any
  private compiling: boolean = false

  constructor(private args: any) {
    console.log(boxen("OWScript Watcher", {
      padding: 1
    }))

    this.spinner = ora("Checking for OWScript config file...").start()

    fs.pathExists(path.join("owscript.config.json"))
      .then(() => {
        this.spinner.succeed("OWScript configuration file found.")
        this.spinner = ora("Reading OWScript config file...").start()

        return fs.readJSON(path.join("owscript.config.json"))
      })
      .then((config) => {
        this.owsConfig = config
        this.spinner.succeed("Configuration has been loaded.")
        this.spinner = ora("Ensuring output directories exist...").start()
        let filepath: string = this.owsConfig["compiler"]["output"]
        filepath = filepath.substring(0, filepath.lastIndexOf("/"))

        return fs.mkdirp(path.resolve(filepath))
      })
      .then(() => {
        this.spinner.succeed("Output directories checked/created.")

        process.stdout.write("\x1Bc")
        this.log("Watching for file changes...")

        chokidar.watch(path.join())
          .on("all", (path: string) => {
            if (!this.compiling) {
              this.compile()
            }
          })
      })
      .catch((error) => {
        console.error(error)
      })
  }

  private compile(): void {
    this.compiling = true
    process.stdout.write("\x1Bc")
    this.log("File change detected, compiling project.")

    exec("python OWScript.py " + path.resolve(this.owsConfig["compiler"]["input"]) + " --save " + path.resolve(this.owsConfig["compiler"]["output"]), 
      {
        cwd: path.resolve(this.owsConfig["compiler"]["bin"])
      }, (error: ExecException, out: string, err: string) => {
        if (error) {
          this.log(chalk.red(err))
          this.compiling = false

          return
        }

        if (out.toLowerCase().includes("error")) {
          this.log(chalk.red(out))
          this.compiling = false

          return
        }

        process.stdout.write("\x1Bc")
        this.log(chalk.green("Script compiled. Watching for further changes..."))
        this.compiling = false

        return
      })
  }

  private log(message: any): void {
    console.log(
      "[" +
      chalk.gray(moment().format("hh:mm:ss A")) + 
      "] " +
      message
    )
  }
}