import type { CheckDefinition, CheckId, Severity } from '../lib/env';
import { CopyButton } from './CopyButton';
import { AlertCircleIcon, AlertTriangleIcon, CheckIcon } from './icons';

interface ResultCardProps {
  check: CheckDefinition;
  id: CheckId;
  keys: string[];
  emptyLabel: string;
}

const severityStyles: Record<
  Severity,
  { icon: string; badge: string; chip: string }
> = {
  error: {
    icon: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
    badge:
      'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20',
    chip: 'border-rose-100 bg-rose-50/70 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    badge:
      'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20',
    chip: 'border-amber-100 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
  },
};

export function ResultCard({ check, id, keys, emptyLabel }: ResultCardProps) {
  const styles = severityStyles[check.severity];
  const titleId = `result-${id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${styles.icon}`}
          >
            {check.severity === 'error' ? (
              <AlertCircleIcon className="h-4 w-4" />
            ) : (
              <AlertTriangleIcon className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <h3 id={titleId} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {check.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {check.description}
            </p>
          </div>
        </div>
        <span
          aria-label={`${keys.length} ${keys.length === 1 ? 'key' : 'keys'}`}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${styles.badge}`}
        >
          {keys.length}
        </span>
      </div>

      <div className="mt-3 flex-1">
        {keys.length === 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <CheckIcon className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            {emptyLabel}
          </p>
        ) : (
          <ul
            aria-label={`${check.title} keys`}
            className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto"
          >
            {keys.map((key) => (
              <li key={key}>
                <code
                  className={`inline-block rounded-md border px-2 py-1 font-mono text-[12px] leading-4 break-all ${styles.chip}`}
                >
                  {key}
                </code>
              </li>
            ))}
          </ul>
        )}
      </div>

      {keys.length > 0 && (
        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <CopyButton
            text={keys.join('\n')}
            label={`Copy ${check.title.toLowerCase()} keys`}
          />
        </div>
      )}
    </article>
  );
}
