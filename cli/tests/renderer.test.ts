import { describe, it, expect, beforeEach } from 'vitest';
import { renderTemplate, renderToFile, renderString } from '../src/core/renderer.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const TEMPLATES_DIR = path.resolve(import.meta.dirname, '../src/templates');

describe('Handlebars helpers', () => {
  describe('join', () => {
    it('joins an array with the given separator', () => {
      const tpl = path.join(TEMPLATES_DIR, 'env.hbs');
      // Use renderTemplate on any template that uses join, or test via inline
      // We'll test helpers indirectly through a minimal template
      const result = renderTemplate(
        createTempTemplate('{{join items ", "}}'),
        { items: ['a', 'b', 'c'] },
      );
      expect(result).toBe('a, b, c');
    });

    it('returns empty string for non-array input', () => {
      const result = renderTemplate(
        createTempTemplate('{{join items ", "}}'),
        { items: null },
      );
      expect(result).toBe('');
    });

    it('uses default comma separator when separator is not a string', () => {
      const result = renderTemplate(
        createTempTemplate('{{join items}}'),
        { items: ['x', 'y'] },
      );
      expect(result).toBe('x, y');
    });
  });

  describe('eq', () => {
    it('returns true when values are strictly equal', () => {
      const result = renderTemplate(
        createTempTemplate('{{#if (eq a b)}}yes{{else}}no{{/if}}'),
        { a: 'foo', b: 'foo' },
      );
      expect(result).toBe('yes');
    });

    it('returns false when values differ', () => {
      const result = renderTemplate(
        createTempTemplate('{{#if (eq a b)}}yes{{else}}no{{/if}}'),
        { a: 'foo', b: 'bar' },
      );
      expect(result).toBe('no');
    });
  });

  describe('includes', () => {
    it('returns true when array contains the item', () => {
      const result = renderTemplate(
        createTempTemplate('{{#if (includes tags "alpha")}}yes{{else}}no{{/if}}'),
        { tags: ['alpha', 'beta'] },
      );
      expect(result).toBe('yes');
    });

    it('returns false when array does not contain the item', () => {
      const result = renderTemplate(
        createTempTemplate('{{#if (includes tags "gamma")}}yes{{else}}no{{/if}}'),
        { tags: ['alpha', 'beta'] },
      );
      expect(result).toBe('no');
    });

    it('returns false for non-array input', () => {
      const result = renderTemplate(
        createTempTemplate('{{#if (includes tags "x")}}yes{{else}}no{{/if}}'),
        { tags: null },
      );
      expect(result).toBe('no');
    });
  });
});

describe('renderTemplate', () => {
  it('renders a template with data substitution', () => {
    const result = renderTemplate(
      createTempTemplate('Hello {{name}}!'),
      { name: 'World' },
    );
    expect(result).toBe('Hello World!');
  });

  it('does not escape HTML (noEscape mode)', () => {
    const result = renderTemplate(
      createTempTemplate('{{content}}'),
      { content: '<div>test</div>' },
    );
    expect(result).toBe('<div>test</div>');
  });

  it('renders with iterators', () => {
    const result = renderTemplate(
      createTempTemplate('{{#each items}}{{this}}\n{{/each}}'),
      { items: ['a', 'b'] },
    );
    expect(result).toBe('a\nb\n');
  });
});

describe('renderToFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-renderer-'));
  });

  it('writes rendered content to the output path', () => {
    const outPath = path.join(tmpDir, 'out.txt');
    renderToFile(
      createTempTemplate('project: {{name}}'),
      { name: 'demo' },
      outPath,
    );
    expect(fs.readFileSync(outPath, 'utf-8')).toBe('project: demo');
  });

  it('creates intermediate directories', () => {
    const outPath = path.join(tmpDir, 'nested', 'deep', 'out.txt');
    renderToFile(
      createTempTemplate('ok'),
      {},
      outPath,
    );
    expect(fs.existsSync(outPath)).toBe(true);
  });
});

describe('renderer helpers', () => {
  it('eq helper compares values', () => {
    const tpl = '{{#if (eq mode "otel")}}OTEL{{else}}OTHER{{/if}}';
    expect(renderString(tpl, { mode: 'otel' })).toBe('OTEL');
    expect(renderString(tpl, { mode: 'datadog' })).toBe('OTHER');
  });
});

// Helper: write a temp .hbs file and return its path
let tmpCounter = 0;
function createTempTemplate(content: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `d-scribe-tpl-${process.pid}-${tmpCounter++}.hbs`);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
