/**
 * 单个项目相关
 */
import { Project, BuildInfo, BuildsInfo } from "guizhan-builds-2-data"
import { request } from "./request"
import { BuildTask } from "./types"
import { uploadJson, upload } from "./r2"
import fs from 'fs/promises'
import { resolve } from "path"

export async function getBuilds(project: Project): Promise<BuildsInfo | null> {
  console.log(`获取项目构建信息: ${project.key}`)

  try {
    const { data } = await request.get<BuildsInfo>(`https://builds-r2.gzassets.net/${project.author}/${project.repository}/${project.branch}/builds.json`)
    return data
  } catch (e) {
    console.log(`项目构建信息不存在`)
    return null
  }
}

export async function uploadBuilds(task: BuildTask) {
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
    console.log('生成全新构建信息')
    buildsInfo = {
      latest: buildInfo.commit,
      builds: [buildInfo]
    } as BuildsInfo
  } else {
    console.log('更新构建信息')
    buildsInfo = {
      latest: buildInfo.commit,
      builds: [...buildsInfo.builds, buildInfo]
    }
  }

  await uploadJson(`${task.project.author}/${task.project.repository}/${task.project.branch}/builds.json`, buildsInfo)
}

export async function uploadBadge(task: BuildTask) {
  let badge = await fs.readFile(resolve(__dirname, '../assets/images/badge.svg'), 'utf-8')
  if (task.success) {
    badge = badge.replace('${status}', '成功')
      .replace('${color}', '#009688')
  } else {
    badge = badge.replace('${status}', '失败')
      .replace('${color}', '#f34436')
  }

  await upload(`${task.project.author}/${task.project.repository}/${task.project.branch}/badge.svg`, badge, 'image/svg+xml')
}
