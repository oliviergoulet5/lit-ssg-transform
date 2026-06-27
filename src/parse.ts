import { readFile, writeFile } from "node:fs/promises";
import { parseHTML } from "linkedom";
import type { TemplateResult } from "lit";
import { render } from "@lit-labs/ssr";

type RenderFn = (
  props: Record<string, string>,
  children?: string
) => TemplateResult;

export function parse(html: string) {
  const { document } = parseHTML(html) as unknown as { document: any };
  return document;
}

export function findComponents(document: any): any[] {
  return Array.from(document.querySelectorAll("*"))
    .filter((el: any) => el.tagName.includes("-"));
}

export const registry = new Map<string, RenderFn>();

function extractProps(el: any): Record<string, string> {
  const props: Record<string, string> = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    props[attr.name] = attr.value;
  }
  return props;
}

export async function ssrElement(el: any, registry: Map<string, RenderFn>): Promise<string> {
  const tag = el.tagName.toLowerCase();

  const Component = registry.get(tag);
  if (!Component) return el.outerHTML;

  const props = extractProps(el);
  const children = el.innerHTML || undefined;

  const template = Component(props, children);

  let output = "";
  for await (const chunk of render(template)) {
    output += chunk;
  }

  return output;
}

export async function processFile(file: string) {
  const input = await readFile(file, "utf-8");
  const document = parse(input);
  const elements = findComponents(document);

  let renderedCount = 0;

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (!registry.has(tag)) continue;

    const rendered = await ssrElement(el, registry);

    el.outerHTML = rendered;
    renderedCount++;
  }

  const output = document.toString();
  await writeFile(file, output);

  return {
    file,
    rendered: renderedCount,
  };
}
