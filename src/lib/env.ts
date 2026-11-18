/**
 * .env parsing and comparison logic for Envguard.
 *
 * Everything here is pure and synchronous so the UI can re-run it on every
 * keystroke. Values are parsed only to detect blanks; they are never rendered
 * or exported.
 */

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

export type Severity = 'error' | 'warning';

export interface EnvEntry {
  key: string;
  value: string;
  /** Zero-based index of the source line. */
  line: number;
}

export type CheckId = 'missing' | 'empty' | 'duplicates' | 'extra';

export interface CheckDefinition {
  id: CheckId;
  title: string;
  description: string;
  severity: Severity;
}

export const CHECKS: readonly CheckDefinition[] = [
  {
    id: 'missing',
    title: 'Missing',
    description: 'In .env.example but not in .env',
    severity: 'error',
  },
  {
    id: 'empty',
    title: 'Empty',
    description: 'Present in .env but blank',
    severity: 'error',
  },
  {
    id: 'duplicates',
    title: 'Duplicates',
    description: 'Defined more than once in .env',
    severity: 'warning',
  },
  {
    id: 'extra',
    title: 'Extra',
    description: 'In .env but not in .env.example',
    severity: 'warning',
  },
] as const;

export interface EnvAnalysis {
  /** Number of distinct keys involved across both files. */
  checked: number;
  errors: number;
  warnings: number;
  missing: string[];
  empty: string[];
  duplicates: string[];
  extra: string[];
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function parseValue(raw: string): string {
  const value = raw.replace(/^\s+/, '');
  const quote = value.charAt(0);

  if (quote === '"' || quote === "'") {
    let result = '';
    for (let i = 1; i < value.length; i += 1) {
      const char = value[i];

      if (quote === '"' && char === '\\' && i + 1 < value.length) {
        const next = value[i + 1];
        if (next === 'n') {
          result += '\n';
          i += 1;
          continue;
        }
        if (next === 'r') {
          result += '\r';
          i += 1;
          continue;
        }
        if (next === 't') {
          result += '\t';
          i += 1;
          continue;
        }
        if (next === '"' || next === '\\' || next === "'") {
          result += next;
          i += 1;
          continue;
        }
        result += char;
        continue;
      }

      // A closing quote ends the value; anything after it is a comment.
      if (char === quote) {
        return result;
      }

      result += char;
    }

    // Unterminated quote: treat the rest of the line as the value.
    return result;
  }

  // Unquoted values may carry an inline " # comment". Check the raw text so
  // that `KEY= # note` (whitespace followed by a comment) counts as blank.
  const commentIndex = raw.search(/\s#/);
  const body = commentIndex === -1 ? raw : raw.slice(0, commentIndex);
  return body.trim();
}

/** Parse a single line, returning null for blanks, comments, and junk. */
export function parseEnvLine(rawLine: string): { key: string; value: string } | null {
  const trimmed = rawLine.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const withoutExport = trimmed.replace(/^export\s+/, '');
  const equalsIndex = withoutExport.indexOf('=');
  if (equalsIndex <= 0) {
    return null;
  }

  const key = withoutExport.slice(0, equalsIndex).trim();
  if (!KEY_PATTERN.test(key)) {
    return null;
  }

  return { key, value: parseValue(withoutExport.slice(equalsIndex + 1)) };
}

/** Parse a whole file. Duplicate keys are preserved in source order. */
export function parseEnv(text: string): EnvEntry[] {
  const entries: EnvEntry[] = [];

  normalizeNewlines(text)
    .split('\n')
    .forEach((line, index) => {
      const parsed = parseEnvLine(line);
      if (parsed) {
        entries.push({ key: parsed.key, value: parsed.value, line: index });
      }
    });

  return entries;
}

/** Compare a template file and a local env file. */
export function analyzeEnv(exampleText: string, envText: string): EnvAnalysis {
  const example = parseEnv(exampleText);
  const env = parseEnv(envText);

  const exampleKeys: string[] = [];
  const exampleSet = new Set<string>();
  for (const { key } of example) {
    if (!exampleSet.has(key)) {
      exampleSet.add(key);
      exampleKeys.push(key);
    }
  }

  const counts = new Map<string, number>();
  const lastValue = new Map<string, string>();
  const envKeys: string[] = [];

  for (const { key, value } of env) {
    if (!counts.has(key)) {
      counts.set(key, 0);
      envKeys.push(key);
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
    lastValue.set(key, value);
  }

  const missing = exampleKeys.filter((key) => !counts.has(key));
  const empty = envKeys.filter((key) => (lastValue.get(key) ?? '').trim() === '');
  const duplicates = envKeys.filter((key) => (counts.get(key) ?? 0) > 1);
  const extra = envKeys.filter((key) => !exampleSet.has(key));

  const checked = new Set([...exampleKeys, ...envKeys]).size;
  const errors = missing.length + empty.length;
  const warnings = duplicates.length + extra.length;

  return { checked, errors, warnings, missing, empty, duplicates, extra };
}

/**
 * Rebuild the local .env with earlier duplicate definitions removed (the last
 * value wins) and missing template keys appended as blank KEY= lines.
 * Comments, blank lines, and untouched formatting are preserved.
 */
export function buildFixedEnv(envText: string, missingKeys: string[]): string {
  const source = normalizeNewlines(envText);
  const entries = parseEnv(source);

  const lastLineForKey = new Map<string, number>();
  for (const entry of entries) {
    lastLineForKey.set(entry.key, entry.line);
  }

  const dropLines = new Set<number>();
  for (const entry of entries) {
    if (lastLineForKey.get(entry.key) !== entry.line) {
      dropLines.add(entry.line);
    }
  }

  const kept = source.split('\n').filter((_, index) => !dropLines.has(index));
  while (kept.length > 0 && kept[kept.length - 1].trim() === '') {
    kept.pop();
  }

  const lines = [...kept, ...missingKeys.map((key) => `${key}=`)];
  if (lines.length === 0) {
    return '';
  }

  return `${lines.join('\n')}\n`;
}

/** Plain-text report. Only key names are included, never values. */
export function buildReport(analysis: EnvAnalysis, generatedAt = new Date()): string {
  const lines: string[] = [];

  lines.push('Envguard report');
  lines.push('===============');
  lines.push('');
  lines.push(`Generated: ${generatedAt.toISOString()}`);
  lines.push(`Variables checked: ${analysis.checked}`);
  lines.push(`Errors: ${analysis.errors}`);
  lines.push(`Warnings: ${analysis.warnings}`);
  lines.push('');

  if (analysis.errors === 0 && analysis.warnings === 0) {
    lines.push('All clear - no issues found.');
    lines.push('');
  }

  for (const check of CHECKS) {
    const keys = analysis[check.id];
    lines.push(`${check.title.toUpperCase()} (${keys.length}) - ${check.severity}`);
    lines.push(check.description);

    if (keys.length === 0) {
      lines.push('  none');
    } else {
      for (const key of keys) {
        lines.push(`  - ${key}`);
      }
    }
    lines.push('');
  }

  lines.push('Only key names appear in this report. Values are never included.');
  return `${lines.join('\n')}\n`;
}
