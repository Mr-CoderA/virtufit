'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-opacity duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(21,43,67,0.14)] ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary:
    'bg-[var(--vf-accent)] text-white border border-transparent hover:opacity-[0.88] ' +
    'min-h-[44px] px-6 py-2.5 text-[13px]',
  secondary:
    'bg-transparent text-[var(--vf-ink)] border border-[rgba(21,43,67,0.14)] hover:bg-[rgba(21,43,67,0.14)] ' +
    'min-h-[44px] px-6 py-2.5 text-[13px]',
  primaryAccent:
    'bg-[var(--vf-accent)] text-white border border-transparent hover:opacity-[0.88] ' +
    'min-h-[44px] px-6 py-2.5 text-[13px]',
  ghost:
    'bg-transparent text-[var(--vf-muted)] border border-transparent hover:text-[var(--vf-ink)] hover:bg-[rgba(21,43,67,0.14)] ' +
    'min-h-[40px] px-4 py-2 text-[13px] rounded-full',
  danger:
    'bg-[var(--vf-surface)] text-[var(--vf-accent)] border border-[rgba(21,43,67,0.14)] hover:bg-[var(--vf-surface-hover)] ' +
    'min-h-[44px] px-5 py-2.5 text-[13px]',
};

const sizes = {
  sm: 'text-[13px] min-h-[40px] px-4 py-2',
  md: '',
  lg: 'min-h-[48px] px-8 py-3 text-[15px]',
};

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function ButtonLink({
  href,
  className = '',
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
