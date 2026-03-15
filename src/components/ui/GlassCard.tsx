'use client';

const cardBase =
  'relative rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] ' +
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
  return (
    <div
      className={
        cardBase +
        (interactive ? ' hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)]' : '') +
        ' ' +
        className
      }
      {...props}
    >
      {cardNumber && (
        <span className="absolute top-5 right-6 text-[11px] font-normal text-[#65635D]">
          {cardNumber}
        </span>
      )}
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
  return (
    <div
      className={'relative rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6 sm:p-7 ' + className}
      {...props}
    >
      {cardNumber && (
        <span className="absolute top-5 right-6 text-[11px] font-normal text-[#65635D]">{cardNumber}</span>
      )}
      {children}
    </div>
  );
}
