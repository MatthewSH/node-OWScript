import * as boxen from "boxen"
import * as ora from "ora"
import * as path from "path"
import * as fs from "fs-extra"
import { exec, ExecException } from "child_process" 

export class Compiler {
  private spinner: ora.Ora
  private owsConfig: any

  constructor(private args: any) {
    console.log(boxen("OWScript Compiler", {
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
        this.spinner = ora("Compiling '" + this.owsConfig["name"] + "' v" + this.owsConfig["version"] + "...").start()

        return this.compile()
      })
      .then(() => {
        this.spinner.succeed("'" + this.owsConfig["name"] + "' v" + this.owsConfig["version"] + " compiled.")
      })
      .catch((error) => {
        this.spinner.fail(error)
      })
  }

  private compile(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      exec("python OWScript.py " + path.resolve(this.owsConfig["compiler"]["input"]) + " --save " + path.resolve(this.owsConfig["compiler"]["output"]), 
      {
        cwd: path.resolve(this.owsConfig["compiler"]["bin"])
      }, (error: ExecException, out: string, err: string) => {
        if (error) {
          reject(err)
        }

        if (out.toLowerCase().includes("error")) {
          reject(out)
        }

        //console.log(out)

        resolve()
      })
      //resolve(true)
    })
  }
}