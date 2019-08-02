export class Shared {
  public static isGitURL(url: string): boolean {
    let regex = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/

    return regex.test(url)
  }
}