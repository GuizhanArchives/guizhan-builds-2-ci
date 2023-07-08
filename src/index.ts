/**
 * 项目入口
 */
import 'dotenv/config'
import { getProjects } from './projects'
import { BuildTask } from './types'
import { buildTask } from './task'
import { getLatestCommit } from './github'
import { getBuilds } from './project'
import { dayjs } from './date'
import fs from 'fs/promises'
import { gitClone } from './git'

async function main() {
  console.log('> 初始化项目')

  const projects = await getProjects()
  console.log(`> 已加载 ${projects.length} 个项目`)

  for (let i = 0; i < projects.length; i++) {
    // if (i >= 1) break
    const project = projects[i]
    console.log('')
    console.log(`> 开始处理项目: ${project.key} (${i + 1}/${projects.length})`)
    const task = await buildTask(projects[i])

    const buildVersion = await check(task)
    if (!buildVersion) {
      console.log(`!> 已是最新/无需构建`)
      continue
    }

    console.log(`!> 开始执行构建 #${buildVersion}`)
    await prepare(task, buildVersion)



    break
  }
}

async function check(task: BuildTask): Promise<number | null> {
  const commit = await getLatestCommit(task.project)
  if (commit.commit.message.toLowerCase().startsWith('[ci skip]')) {
    console.log('项目跳过构建')
    return null
  }
  const buildsInfo = await getBuilds(task.project)
  if (buildsInfo === null) {
    return 1
  }
  task.commit = {
    timestamp: dayjs(commit.commit.author?.date as string || Date.now()).valueOf(),
    author: (commit.author?.login ?? commit.commit.author?.name) || '',
    message: commit.commit.message,
    sha: commit.sha
  }
  if (commit.sha !== buildsInfo.latest) {
    return buildsInfo.builds.length + 1
  } else {
    return null
  }
}

async function prepare(task: BuildTask, version: number) {
  const date = dayjs(task.commit?.timestamp)

  task.finalVersion = task.project.buildOptions.version
    .replace('{version}', version.toString())
    .replace('{git_commit}', task.commit?.sha.slice(0, 7) || '')
    .replace('{Year}', date.year().toString())
    .replace('{year}', date.year().toString().slice(2))
    .replace('{Month}', (date.month() + 1).toString().padStart(2, '0'))
    .replace('{month}', (date.month() + 1).toString())
    .replace('{Date}', date.date().toString().padStart(2, '0'))
    .replace('{date}', date.date().toString())

  try {
    await fs.access(task.workspace)
    await fs.rm(task.workspace, { recursive: true })
  } catch (ignored) {
    try {
      await fs.mkdir(task.workspace, { recursive: true })
    } catch (e) {
      console.error('创建工作目录失败')
      process.exit(1)
    }
  }

  await gitClone(task)
}

main()
