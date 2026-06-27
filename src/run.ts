import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { crawl } from "./crawler.js";

export async function run(options: any) {
  const start = performance.now();

  // Load config
  const config = await loadConfig(options.config);

  // @todo: Merge CLI overrides
  const finalConfig = { ...config };
  
  // Find files
  const files = await crawl(finalConfig.dir, {
    include: finalConfig.include,
    exclude: finalConfig.exclude,
  });

  const end = performance.now();

  console.log(`\n✔ Done`);
  console.log(`Files: ${files.length}`);
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
  // Stubbed
  return {
    dir: "public",
    include: ["**/*.html"]
  };
}
