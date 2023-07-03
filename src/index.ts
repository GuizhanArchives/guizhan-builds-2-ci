/**
 * 项目入口
 */
import { getProjects } from './projects'
import { buildTask } from './task'

async function main() {
  console.log('> 初始化项目')

  const projects = await getProjects()
  console.log(`> 已加载 ${projects.length} 个项目`)

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    console.log('')
    console.log(`> 开始处理项目: ${project.key} (${i + 1}/${projects.length})`)
    const task = await buildTask(projects[i])

  }
}

main()
