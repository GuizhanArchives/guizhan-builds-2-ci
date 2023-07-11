/**
 * Maven 相关方法
 */
import { resolve, join } from "path";
import { BuildTask } from "./types";
import fs from "fs/promises";
import { xml2js, js2xml } from "xml-js";
import maven from "maven";
import { uploadFile } from "./r2";
import { getFileSha1 } from "./checksum";

export async function setVersion(task: BuildTask) {
  const pom = resolve(task.workspace, "./pom.xml");
  try {
    const content = await fs.readFile(pom, "utf-8");
    const pomContent = await xml2js(content, { compact: true }) as any;
    pomContent.project.build.finalName._text = "${project.name}-${project.version}";
    pomContent.project.artifactId._text = task.project.buildOptions.name;
    pomContent.project.version._text = task.finalVersion;
    await fs.writeFile(pom, js2xml(pomContent, { compact: true }));
  } catch (e) {
    console.error("设置 Maven 版本失败", e);
  }
}

export async function build(task: BuildTask) {
  const mvnDir = join(task.workspace, "./.mvn");
  // 如有.mvn目录则移除
  if (await fs.stat(mvnDir).then(() => true).catch(() => false)) {
    await fs.rm(mvnDir, { recursive: true });
  }

  const mvn = maven.create({
    cwd: task.workspace,
    batchMode: true,
    logFile: resolve(task.workspace, "./maven.log")
  });
  return await mvn.execute(["clean", "package"]);
}

export async function cleanup(task: BuildTask) {
  // 构建成功时上传构建结果
  if (task.success) {
    const target = `${task.project.buildOptions.name}-${task.finalVersion}.jar`;
    const targetPath = join(task.workspace, "./target", target);
    await uploadFile(`${task.project.author}/${task.project.repository}/${task.project.branch}/${target}`, targetPath);

    // 获取checksum
    task.target = target;
    task.sha1 = await getFileSha1(targetPath);
  }

  // 上传日志
  const logPath = resolve(task.workspace, "./maven.log");
  await uploadFile(`${task.project.author}/${task.project.repository}/${task.project.branch}/Build-${task.version}.log`, logPath, "text/plain");
}

export default { setVersion, build, cleanup };
