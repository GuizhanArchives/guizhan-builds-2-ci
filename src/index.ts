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
import maven from './mavenB'
import gradle from './gradleB'
import { BuildInfo, BuildsInfo } from 'guizhan-builds-2-data'
import { uploadJson, uploadFile } from './r2'
import { resolve } from 'path'

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

    task.version = buildVersion

    console.log(`!> 开始执行构建 #${buildVersion}`)
    console.log('正在进行准备任务')
    await prepare(task, buildVersion)

    console.log('开始构建')
    try {
      await build(task)
      console.log('构建成功')
      task.success = true
    } catch (e) {
      task.success = false
      console.error('构建失败')
    }

    console.log('执行清理工作')
    await cleanup(task)

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
    console.log('工作目录已存在，正在清理')
    await fs.rm(task.workspace, { recursive: true })
    await fs.mkdir(task.workspace, { recursive: true })
  } catch (ignored) {
    try {
      await fs.mkdir(task.workspace, { recursive: true })
    } catch (e) {
      console.error('创建工作目录失败')
      process.exit(1)
    }
  }

  console.log('克隆仓库中')
  await gitClone(task)

  console.log('设置版本信息')
  if (task.project.type === 'maven') {
    await maven.setVersion(task)
  } else if (task.project.type === 'gradle') {
    await gradle.setVersion(task)
  }
}

async function build(task: BuildTask) {
  if (task.project.type === 'maven') {
    await maven.build(task)
  } else if (task.project.type === 'gradle') {
    await gradle.build(task)
  }
}

async function cleanup(task: BuildTask) {
  if (task.project.type === 'maven') {
    await maven.cleanup(task)
  } else if (task.project.type === 'gradle') {
    await gradle.cleanup(task)
  }

  // 删除工作目录
  await fs.rm(task.workspace, { recursive: true })

  // 生成构建信息
  const buildInfo: BuildInfo = {
    id: task.version as number,
    commit: task.commit?.sha || '',
    author: task.commit?.author || '',
    timestamp: task.commit?.timestamp || Date.now(),
    message: task.commit?.message || '',
    success: task.success || false,
    buildTimestamp: Date.now(),
    target: task.target || '',
    sha1: task.sha1 || ''
  }

  let buildsInfo = await getBuilds(task.project)
  if (buildsInfo === null) {
    buildsInfo = {
      latest: buildInfo.commit,
      builds: [buildInfo]
    } as BuildsInfo
  } else {
    buildsInfo = {
      latest: buildInfo.commit,
      builds: [...buildsInfo.builds, buildInfo]
    }
  }

  await uploadJson(`${task.project.author}/${task.project.repository}/${task.project.branch}/builds.json`, buildsInfo)

  // 生成构建标志
  let badge = await fs.readFile(resolve(__dirname, '../assets/images/badge.svg'), 'utf-8')
  if (task.success) {
    badge = badge.replace('${status}', '成功')
      .replace('${color}', '#009688')
  } else {
    badge = badge.replace('${status}', '失败')
      .replace('${color}', '#f34436')
  }

  await uploadFile(`${task.project.author}/${task.project.repository}/${task.project.branch}/badge.svg`, badge, 'image/svg+xml')
}

main()
