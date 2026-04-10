const SAST_RULESETS: Record<string, string[]> = {
  java: ['java-code-style', 'java-best-practices', 'java-security'],
  python: ['python-code-style', 'python-best-practices', 'python-security'],
  node: ['javascript-code-style', 'javascript-best-practices', 'typescript-best-practices'],
  ruby: ['ruby-code-style', 'ruby-best-practices', 'ruby-security'],
  php: ['php-code-style', 'php-best-practices', 'php-security'],
  go: ['go-best-practices', 'go-security'],
  dotnet: ['csharp-code-style', 'csharp-best-practices', 'csharp-security'],
};

export function getSastRulesets(backends: string[]): string[] {
  const languages = new Set(backends.map(b => b.split(':')[0]));
  return [...languages].flatMap(lang => SAST_RULESETS[lang] ?? []);
}
