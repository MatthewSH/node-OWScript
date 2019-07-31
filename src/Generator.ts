import * as inquirer from "inquirer"
import * as path from "path"
import * as fs from "fs-extra"

export class Generator {
  private fullPath: string = null;
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
        this.generate()
      })
  }

  private generate() {
    // First things first. Let's generate a src/ folder and get the index stub.
    fs.mkdirp(path.resolve(this.fullPath, "src"))
      .then(() => {
        return fs.copy(path.resolve(__dirname, "..", "stubs", "index.owpy.stub"), path.resolve(this.fullPath, "src", "index.owpy"))
      })



    // fs.writeJSON(path.resolve(this.fullPath, "test.json"), {
    //   test: "test object string"
    // })
  }
}