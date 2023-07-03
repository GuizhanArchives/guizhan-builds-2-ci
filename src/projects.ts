/**
 * 项目列表(repos.json)相关
 *
 * repos.json文件存储于前端仓库
 */
import { Project, RawProject } from 'guizhan-builds-2-data'
import { request } from './request'

export async function getProjects(): Promise<Project[]> {
  const projects: Project[] = []
  try {
    const { data: rawProjects } = await request.get<Record<string, RawProject>>('https://raw.githubusercontent.com/ybw0014/guizhan-builds-2-frontend/master/public/repos.json')
    for (const [key, rawProject] of Object.entries(rawProjects)) {
      const [author, repoNBranch] = key.split('/')
      const [repository, branch] = repoNBranch.split(':')
      const project: Project = {
        key,
        author,
        repository,
        branch,
        ...(rawProject as RawProject),
      }
      projects.push(project)
    }
    return projects
  } catch (err) {
    console.error('> 获取项目列表失败')
    return projects
  }
}
