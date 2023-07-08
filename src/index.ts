/**
 * 项目入口
 */
import 'dotenv/config'
import { getProjects } from './projects'
import { BuildTask } from './types'
import { buildTask } from './task'
import { getLatestCommit } from './github'
import { getBuilds } from './project'

async function main() {
  console.log('> 初始化项目')

  const projects = await getProjects()
  console.log(`> 已加载 ${projects.length} 个项目`)

  for (let i = 0; i < projects.length; i++) {
    if (i >= 1) break
    const project = projects[i]
    console.log('')
    console.log(`> 开始处理项目: ${project.key} (${i + 1}/${projects.length})`)
    const task = await buildTask(projects[i])

    const needBuild = await check(task)
    if (!needBuild) {
      console.log(`!> 已是最新/无需构建`)
      continue
    }

    console.log(`!> 开始执行构建`)


  }
}

async function check(task: BuildTask): Promise<boolean> {
  const commit = await getLatestCommit(task.project)
  if (commit.commit.message.toLowerCase().startsWith('[ci skip]')) {
    console.log('!> 项目跳过构建')
    return false
  }
  const buildsInfo = await getBuilds(task.project)
  if (buildsInfo === null) {
    return true
  }
  return commit.sha !== buildsInfo.latest
}

main()
