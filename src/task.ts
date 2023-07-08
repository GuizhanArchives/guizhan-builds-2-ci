/**
 * 项目任务相关方法
 */

import { Project } from 'guizhan-builds-2-data'
import { BuildTask } from './types'

export async function buildTask(project: Project): Promise<BuildTask> {
  console.log(`!> 建立项目任务: ${project.key}`)

  return {
    project
  }
}
