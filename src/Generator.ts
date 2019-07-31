import * as inquirer from "inquirer"
import * as path from "path"
import * as fs from "fs-extra"
import { execSync } from "child_process" 
import * as semver from "semver"
import * as cmdExists from "command-exists"
import * as deepmerge from "deepmerge"
import * as p from "phin"
import * as request from "request"
import * as tar from "tar"
import * as zlib from "zlib"

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
              message: "It seems that '" + this.fullPath + "' already exists. Would you like to overwrite it and generate a new OWScript project?",
              default: false
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
        } else if (projectExists && !answers["confirm"]) {
          console.log("You chose to not overwrite. Exiting generation...")
          process.exit()
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

  private async generate() {
    fs.mkdirp(path.resolve(this.fullPath, "src"))
      .then(() => {
        return fs.copy(path.resolve(__dirname, "..", "stubs", "index.owpy.stub"), path.resolve(this.fullPath, "src", "index.owpy"))
      })
      .then(() => {
        return inquirer.prompt(this.setupQuestions())      
      })
      .then(async (answers: any) => {
        let userObj: any = {};

        userObj["name"] = answers["name"]
        userObj["author"] = answers["author"]
        userObj["version"] = answers["version"]

        if (answers["hasWesbite"]) {
          userObj["website"] = answers["website"]
        }

        if (answers["useGit"]) {
          userObj["git"] = {}
          userObj["git"]["repo"] = answers["gitRepoLink"]

          execSync("git init")
        }

        if (answers["owscript_install"] !== "n") {
          userObj["compiler"] = {}
          userObj["compiler"]["bin"] = "./OWScript"

          await this.installOWS(answers["useGit"], answers["owscript_install"])
        }

        let outputObj: {} = deepmerge(userObj, this.baseConfigObject())

        return fs.writeJson(path.resolve(this.fullPath, "owscript.config.json"), outputObj)
      })
  }

  private async installOWS(useGit: boolean, installArg: string) {
    if (useGit) {
      if (installArg === "master") {
        execSync("git submodule add -b master git@github.com:adapap/OWScript.git OWScript")
      } else if(installArg === "release") {
        let repoRequest = await p({
          url: "https://api.github.com/repos/adapap/OWScript/releases",
          parse: "json"
        })

        let branchName = repoRequest.body[0]["tag_name"]
        execSync("git submodule add -b " + branchName + " git@github.com:adapap/OWScript.git OWScript")
      }
    } else {
      let requestURL: string = null
      if (installArg === "master") {
        requestURL = "https://api.github.com/repos/adapap/OWScript/tarball/master";
      } else if (installArg === "release") {
        let repoRequest = await p({
          url: "https://api.github.com/repos/adapap/OWScript/releases",
          parse: "json"
        })

        let branchName = repoRequest.body[0]["tag_name"]
        requestURL = "https://api.github.com/repos/adapap/OWScript/tarball/" + branchName;
      }

      request(requestURL, {
        headers: {
          "User-Agent": "OWScript-NodeJS-CLI"
        }
      }).pipe(fs.createWriteStream(path.resolve(this.fullPath, "ows.tar.gz")))

      fs.mkdir(path.resolve(this.fullPath, "OWScript"))
        .then(() => {
          return tar.x({
            file: path.resolve(this.fullPath, "ows.tar.gz"),
            strip: 1,
            C: path.resolve(this.fullPath, "OWScript")
          })
        })
        .then(() => {
        //fs.unlink(path.resolve(this.fullPath, "ows.tar.gz"))
      })
    }
  } 

  private setupQuestions(): Array<{}> {
    return [
      {
        type: "input",
        name: "name",
        message: "What is the name of your script/gamemode?",
        default: "my-gamemode"
      },
      {
        type: "input",
        name: "author",
        message: "Author name?",
        default: null
      },
      {
        type: "input",
        name: "version",
        message: "What version is your script/gamemode?",
        default: "1.0.0"
      },
      {
        type: "confirm",
        name: "hasWebsite",
        message: "Do you have a website for this script/gamemode?",
        default: false
      },
      {
        type: "input",
        name: "website",
        message: "What is the website?",
        default: null,
        when: function(answers: any) {
          return answers["hasWebsite"]
        }
      },
      {
        type: "expand",
        name: "owscript_install",
        message: "What version/branch of OWScript would you like installed?",
        choices: [
          {
            key: "m",
            name: "Master",
            value: "master"
          },
          {
            key: "r",
            name: "Latest Release",
            value: "release"
          },
          new inquirer.Separator(),
          {
            key: "n",
            name: "Don't Install",
            value: "none"
          }
        ]
      },
      {
        type: "confirm",
        name: "useGit",
        message: "Would you like to use Git?",
        default: true
      },
      {
        type: "input",
        name: "gitRepoLink",
        message: "What is the Git repository link?",
        default: null,
        when: function(answers: any) {
          return answers["useGit"];
        }
      }
    ]
  }

  private baseConfigObject(): {} {
    return {
      compiler: {
        input: "src/index.owpy",
        output: "dist/index.owpy",
        options: {
          generateAdapapCredit: true,
          generateVersionRule: true,
          generateCreditRule: true
        }
      },
      cli: {
        git: {
          useHTTPS: false
        },
        locations: {
          modules: "src/modules"
        }
      }
    }
  }
}