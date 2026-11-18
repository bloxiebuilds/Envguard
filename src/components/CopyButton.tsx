import { useCopy } from '../lib/useCopy';
import { CheckIcon, CopyIcon } from './icons';

interface CopyButtonProps {
  text: string;
  /** Accessible name describing what is copied. */
  label: string;
  className?: string;
}

export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const { copied, copy } = useCopy();

  return (
    <button
      type="button"
      onClick={() => {
        void copy(text);
      }}
      aria-label={copied ? 'Copied to clipboard' : label}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:bg-teal-500/10 dark:hover:text-teal-200 dark:focus-visible:ring-offset-slate-900 ${className}`}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      <span>{copied ? 'Copied' : 'Copy'}</span>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
