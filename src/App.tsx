import { useEffect, useMemo, useState } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { ResultCard } from './components/ResultCard';
import { ThemeToggle } from './components/ThemeToggle';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CopyIcon,
  DownloadIcon,
  LockIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
} from './components/icons';
import {
  CHECKS,
  analyzeEnv,
  buildFixedEnv,
  buildReport,
  type CheckId,
  type EnvAnalysis,
} from './lib/env';
import { SAMPLE_ENV, SAMPLE_EXAMPLE } from './lib/sample';
import { downloadText } from './lib/download';
import { useCopy } from './lib/useCopy';

type BannerState = 'idle' | 'clean' | 'issues';

const EMPTY_LABELS: Record<CheckId, string> = {
  missing: 'No missing keys.',
  empty: 'No empty values.',
  duplicates: 'No duplicate keys.',
  extra: 'No extra keys.',
};

const bannerStyles: Record<
  BannerState,
  { wrap: string; icon: string; title: string; detail: string }
> = {
  idle: {
    wrap: 'border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60',
    icon: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    title: 'text-slate-800 dark:text-slate-100',
    detail: 'text-slate-500 dark:text-slate-400',
  },
  clean: {
    wrap:
      'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/25 dark:bg-emerald-500/10',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    title: 'text-emerald-900 dark:text-emerald-100',
    detail: 'text-emerald-700 dark:text-emerald-200/80',
  },
  issues: {
    wrap: 'border-rose-200 bg-rose-50/80 dark:border-rose-500/25 dark:bg-rose-500/10',
    icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    title: 'text-rose-900 dark:text-rose-100',
    detail: 'text-rose-700 dark:text-rose-200/80',
  },
};

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getBannerState(analysis: EnvAnalysis): BannerState {
  if (analysis.checked === 0) {
    return 'idle';
  }
  if (analysis.errors === 0 && analysis.warnings === 0) {
    return 'clean';
  }
  return 'issues';
}

function SummaryBanner({ analysis }: { analysis: EnvAnalysis }) {
  const state = getBannerState(analysis);
  const styles = bannerStyles[state];
  const Icon =
    state === 'clean' ? CheckCircleIcon : state === 'issues' ? AlertCircleIcon : ShieldIcon;

  const title =
    state === 'clean'
      ? `All clear, ${pluralize(analysis.checked, 'variable')} checked`
      : state === 'issues'
        ? `${pluralize(analysis.errors, 'error')}, ${pluralize(analysis.warnings, 'warning')}`
        : 'Nothing checked yet';

  const detail =
    state === 'clean'
      ? 'Your .env matches .env.example. You are good to deploy.'
      : state === 'issues'
        ? analysis.errors > 0
          ? 'Fix the errors below before you deploy.'
          : 'Review the warnings below before you deploy.'
        : 'Paste both files, or load the sample, to see Envguard in action.';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${styles.wrap}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${styles.icon}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        <p className={`mt-0.5 text-xs ${styles.detail}`}>{detail}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [exampleText, setExampleText] = useState('');
  const [envText, setEnvText] = useState('');
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);

  const theme = themeOverride ?? (prefersDark ? 'dark' : 'light');
  const { copied: fixedCopied, copy: copyFixed } = useCopy();

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const analysis = useMemo(() => analyzeEnv(exampleText, envText), [exampleText, envText]);
  const fixedEnv = useMemo(
    () => buildFixedEnv(envText, analysis.missing),
    [envText, analysis.missing],
  );
  const hasInput = exampleText.trim().length > 0 || envText.trim().length > 0;

  const handleLoadSample = () => {
    setExampleText(SAMPLE_EXAMPLE);
    setEnvText(SAMPLE_ENV);
  };

  const handleClear = () => {
    setExampleText('');
    setEnvText('');
  };

  const handleDownload = () => {
    const filename = `envguard-report-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadText(filename, buildReport(analysis));
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(20,184,166,0.16),transparent_70%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(45,212,191,0.12),transparent_70%)]"
      />

      <a
        href="#results"
        className="sr-only rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        Skip to results
      </a>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <header className="pt-8 sm:pt-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-600/25 ring-1 ring-inset ring-white/20">
                <ShieldIcon className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  Envguard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Guard your env before you deploy
                </p>
              </div>
            </div>
            <ThemeToggle
              theme={theme}
              onToggle={() => setThemeOverride(theme === 'dark' ? 'light' : 'dark')}
            />
          </div>

          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
            <LockIcon className="h-3.5 w-3.5" />
            Runs 100% in your browser. Nothing is uploaded.
          </p>
        </header>

        <main>
          <section aria-labelledby="files-heading" className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="files-heading"
                className="text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Your files
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-teal-500/30 dark:bg-slate-900 dark:text-teal-200 dark:hover:bg-teal-500/10 dark:focus-visible:ring-offset-slate-950"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasInput}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <EditorPanel
                id="example-input"
                title=".env.example"
                hint="template"
                placeholder={'NODE_ENV=development\nDATABASE_URL=\nSTRIPE_SECRET_KEY='}
                value={exampleText}
                onChange={setExampleText}
                describedBy="example-hint"
                hintText="Paste the env template kept in your repository."
              />
              <EditorPanel
                id="env-input"
                title=".env"
                hint="your values"
                placeholder={'NODE_ENV=development\nDATABASE_URL=postgres://localhost/app'}
                value={envText}
                onChange={setEnvText}
                describedBy="env-hint"
                hintText="Paste your local env file. It never leaves this tab."
              />
            </div>
          </section>

          <section id="results" aria-labelledby="results-heading" className="mt-10 scroll-mt-6">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="results-heading"
                className="text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Results
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />
                Updates as you type
              </span>
            </div>

            <div className="mt-3">
              <SummaryBanner analysis={analysis} />
            </div>

            {analysis.checked > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {CHECKS.map((check) => (
                  <ResultCard
                    key={check.id}
                    check={check}
                    id={check.id}
                    keys={analysis[check.id]}
                    emptyLabel={EMPTY_LABELS[check.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/30">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <ShieldIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Your results will appear here
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  Paste your files above, or press{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Load sample
                  </span>{' '}
                  to try Envguard instantly.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Copy fixed .env
                </span>{' '}
                keeps your comments, drops earlier duplicates (the last value wins), and appends
                missing keys as <code className="font-mono">KEY=</code>. The report contains key
                names only — never values.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void copyFixed(fixedEnv);
                  }}
                  disabled={fixedEnv.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400 dark:focus-visible:ring-offset-slate-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                  <CopyIcon className="h-4 w-4" />
                  {fixedCopied ? 'Copied fixed .env' : 'Copy fixed .env'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-teal-300 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-500/50 dark:hover:text-teal-200 dark:focus-visible:ring-offset-slate-950"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download report
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-12 flex flex-col gap-2 border-t border-slate-200/80 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-500">
          <p>Envguard — MIT licensed. Nothing you paste leaves this tab.</p>
          <a
            href="https://github.com/bloxiebuilds/envguard"
            target="_blank"
            rel="noreferrer"
            className="w-fit font-medium text-slate-600 underline-offset-4 hover:text-teal-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-slate-400 dark:hover:text-teal-300"
          >
            Made by bloxiebuilds
          </a>
        </footer>
      </div>
    </div>
  );
}
