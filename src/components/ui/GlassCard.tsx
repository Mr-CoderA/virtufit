'use client';

const cardBase =
  'relative rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] ' +
  'transition-[background-color,border-color] duration-200';

export function GlassCard({
  className = '',
  cardNumber,
  children,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  cardNumber?: string;
  interactive?: boolean;
}) {
  void cardNumber; // Retain the legacy prop without decorative numbering.
  return (
    <div
      className={
        cardBase +
        (interactive ? ' hover:bg-[var(--vf-surface-hover)] hover:border-[rgba(21,43,67,0.14)]' : '') +
        ' ' +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardInner({
  className = '',
  cardNumber,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { cardNumber?: string }) {
  void cardNumber; // Retain the legacy prop without decorative numbering.
  return (
    <div
      className={'relative rounded-2xl border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-6 sm:p-7 ' + className}
      {...props}
    >
      {children}
    </div>
  );
}
