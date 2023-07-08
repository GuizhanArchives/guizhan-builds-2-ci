/**
 * 单个项目相关
 */
import { Project, BuildsInfo } from "guizhan-builds-2-data"
import { request } from "./request"

export async function getBuilds(project: Project): Promise<BuildsInfo | null> {
  console.log(`!> 获取项目构建信息: ${project.key}`)

  try {
    const { data } = await request.get<BuildsInfo>(`https://builds-r2.gzassets.net/${project.author}/${project.repository}/${project.branch}/builds.json`)
    return data
  } catch (e) {
    console.log(`?> 项目构建信息不存在`)
    return null
  }
}
