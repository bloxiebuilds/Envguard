interface EditorPanelProps {
  id: string;
  title: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  describedBy: string;
  hintText: string;
}

export function EditorPanel({
  id,
  title,
  hint,
  placeholder,
  value,
  onChange,
  describedBy,
  hintText,
}: EditorPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-2.5 dark:border-slate-800">
        <label
          htmlFor={id}
          className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {title}
        </label>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-describedby={describedBy}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        className="block h-64 w-full resize-y overflow-auto bg-transparent p-4 font-mono text-[13px] leading-6 text-slate-800 caret-teal-600 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 dark:text-slate-100 dark:caret-teal-300 dark:placeholder:text-slate-600"
      />
      <p
        id={describedBy}
        className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800/70 dark:text-slate-500"
      >
        {hintText}
      </p>
    </div>
  );
}
