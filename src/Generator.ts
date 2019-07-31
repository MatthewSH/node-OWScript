import * as inquirer from "inquirer"
import * as path from "path"
import * as fs from "fs-extra"
import { execSync } from "child_process" 
import * as semver from "semver"
import * as cmdExists from "command-exists"

export class Generator {
  private fullPath: string = null;
  private minPyVersion: string = ">= 3.7.2"
  constructor(private projectName: string, private projectPath: string) {
    this.fullPath = path.resolve(this.projectPath != undefined? this.projectPath : "", this.projectName)
    console.log("Generating new project. You'll be asked a couple questions throughout this process.")

    this.preflight()
  }

  private preflight() {
    let projectExists: boolean = false;
    fs.pathExists(this.fullPath)
      .then((exists: boolean) => {
        projectExists = exists

        if (exists) {
          return inquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: "It seems that '" + this.fullPath + "' already exists. Would you like to overwrite it and generate a new OWScript project?"
            }
          ])
        } else {
          return inquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: "This command will generate a new OWScript project. Would you to continue?"
            }
          ])
        }
      })
      .then((answers: any) => {
        if (projectExists && answers["confirm"]) {
          return fs.remove(this.fullPath)
        } else {
          return Promise.resolve()
        }
      })
      .then(() => {
        return fs.mkdirp(this.fullPath)
      })
      .then(() => {
        return inquirer.prompt([
          {
            type: "confirm",
            name: "check_prereq",
            message: "Would you like to check for proper Python3 version and Git before generating the project?",
            default: false
          }
        ])
      })
      .then((answers: any) => {
        if (answers["check_prereq"]) {
          let pythonValid: boolean = semver.satisfies(execSync("python -c \"import platform; print(platform.python_version())\"").toString(), this.minPyVersion)
          let gitValid: boolean = cmdExists.sync("git")

          if (!pythonValid || !gitValid) {
            console.error("Requirements are not met. Exiting.")
            process.exit(1)
          } else {
            console.log("All requirements are met. Moving onto project generation.")
          }
        }

        this.generate()
      })
  }

  private generate() {
    // First things first. Let's generate a src/ folder and get the index stub.
    fs.mkdirp(path.resolve(this.fullPath, "src"))
      .then(() => {
        return fs.copy(path.resolve(__dirname, "..", "stubs", "index.owpy.stub"), path.resolve(this.fullPath, "src", "index.owpy"))
      })
  }
}