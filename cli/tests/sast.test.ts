import { describe, it, expect } from 'vitest';
import { getSastRulesets } from '../src/core/sast.js';

describe('getSastRulesets', () => {
  it('returns java rulesets for java:spring backend', () => {
    const rulesets = getSastRulesets(['java:spring']);
    expect(rulesets).toContain('java-code-style');
    expect(rulesets).toContain('java-best-practices');
    expect(rulesets).toContain('java-security');
  });

  it('returns python rulesets for python:flask backend', () => {
    const rulesets = getSastRulesets(['python:flask']);
    expect(rulesets).toContain('python-code-style');
    expect(rulesets).toContain('python-best-practices');
    expect(rulesets).toContain('python-security');
  });

  it('deduplicates rulesets for same-language backends', () => {
    const rulesets = getSastRulesets(['java:spring', 'java:quarkus']);
    const javaRulesets = rulesets.filter(r => r.startsWith('java-'));
    expect(javaRulesets).toHaveLength(3);
  });

  it('combines rulesets for polyglot projects', () => {
    const rulesets = getSastRulesets(['java:spring', 'python:flask']);
    expect(rulesets).toContain('java-security');
    expect(rulesets).toContain('python-security');
  });

  it('returns node/typescript rulesets for node:express', () => {
    const rulesets = getSastRulesets(['node:express']);
    expect(rulesets).toContain('javascript-code-style');
    expect(rulesets).toContain('typescript-best-practices');
  });

  it('returns empty array for unknown backend', () => {
    const rulesets = getSastRulesets(['unknown:thing']);
    expect(rulesets).toHaveLength(0);
  });
});
