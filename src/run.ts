import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { crawl } from "./crawler.js";
import { processFile } from "./parse.js";
import { registerComponents } from "./components.js";

export async function run(options: any) {
  const start = performance.now();

  const config = await loadConfig(options.config);
  const finalConfig = { ...config };

  registerComponents();

  const files = await crawl(finalConfig.dir, {
    include: finalConfig.include,
    exclude: finalConfig.exclude,
  });

  let totalRendered = 0;
  for (const file of files) {
    const result = await processFile(file);
    totalRendered += result.rendered;
  }

  const end = performance.now();

  console.log(`\n✔ Done`);
  console.log(`Files: ${files.length}`);
  console.log(`Components rendered: ${totalRendered}`);
  console.log(`Time: ${(end - start).toFixed(0)}ms`);
}

const CONFIG_FILE_NAMES = [
  "lit-ssg.config.js",
  "lit-ssg.config.mjs",
  "lit-ssg.config.cjs",
  ".lit-ssgrc",
  ".lit-ssgrc.json",
];

export function resolveConfigPath(configPath?: string): string | undefined {
  if (configPath) {
    const absolutePath = path.resolve(process.cwd(), configPath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }

    return undefined;
  }

  for (const fileName of CONFIG_FILE_NAMES) {
    const absolutePath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return undefined;
}

export async function loadConfig(configPath?: string) {
  const resolvedPath = resolveConfigPath(configPath);

  if (!resolvedPath) {
    return getDefaultConfig();
  }

  const ext = path.extname(resolvedPath);

  if (ext === ".json") {
    return JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  }

  const config = await import(pathToFileURL(resolvedPath).href);
  return config.default ?? config;
}

function getDefaultConfig() {
  return {
    dir: "public",
    include: ["**/*.html"],
    outDir: "dist/public",
  };
}
