// cli/src/core/renderer.ts
import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';

// Register helpers
Handlebars.registerHelper('join', (list: string[], separator: string) => {
  if (!Array.isArray(list)) return '';
  return list.join(typeof separator === 'string' ? separator : ', ');
});

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

Handlebars.registerHelper('includes', (list: string[], item: string) => {
  if (!Array.isArray(list)) return false;
  return list.includes(item);
});

Handlebars.registerHelper('json', (context: unknown) => JSON.stringify(context));

export function renderTemplate(templatePath: string, data: Record<string, unknown>): string {
  const raw = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(raw, { noEscape: true });
  return template(data);
}

export function renderToFile(templatePath: string, data: Record<string, unknown>, outputPath: string): void {
  const content = renderTemplate(templatePath, data);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
}

export function renderString(template: string, data: unknown): string {
  return Handlebars.compile(template)(data);
}
