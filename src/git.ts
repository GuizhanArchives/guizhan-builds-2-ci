/**
 * 本地 Git 相关
 */
import { spawnSync, SpawnSyncOptions } from 'child_process'
import _ from 'lodash'

const defaultGitOptions: Partial<SpawnSyncOptions> = {
  cwd: process.cwd(),
  env: process.env,
  stdio: [process.stdin, process.stdout, process.stderr],
  encoding: 'utf-8'
}

export function gitExec(params: string[], options?: Partial<SpawnSyncOptions>) {
  const result = spawnSync('git', params, _.defaults(options, defaultGitOptions))
  return result.stdout.toString()
}
