import fg from "fast-glob";

type CrawlOptions = {
  include: string[];
  exclude: string[];
};

export async function crawl(dir: string, options: CrawlOptions): Promise<string[]> {
  const patterns = options.include;

  const files = await fg(patterns, {
    cwd: dir,
    ignore: options.exclude,
    onlyFiles: true,
    absolute: true,
  });

  return files;
}
