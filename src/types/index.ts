import { Project } from 'guizhan-builds-2-data'

export interface TaskCommit {
  timestamp: number,
  author: string,
  message: string,
  sha: string
}

export interface BuildTask {
  project: Project,
  commit?: TaskCommit
  finalVersion?: string
  workspace: string
}
