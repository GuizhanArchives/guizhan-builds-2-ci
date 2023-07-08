/**
 * GitHub 相关
 */
import { Project } from 'guizhan-builds-2-data'
import { githubRequest } from './request'
import { Endpoints } from '@octokit/types'

type CommitResponse = Endpoints['GET /repos/{owner}/{repo}/commits']['response']['data'][0]

export async function getLatestCommit(project: Project): Promise<CommitResponse> {
  console.log('获取最新commit')

  try {
    const { data } = await githubRequest.request('GET /repos/{owner}/{repo}/commits', {
      owner: project.author,
      repo: project.repository,
      sha: project.branch,
      per_page: 1
    })
    return data[0]
  } catch (e) {
    console.error('获取最新commit失败')
    process.exit(1)
  }
}
