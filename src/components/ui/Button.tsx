'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-opacity duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(240,239,232,0.14)] ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary:
    'bg-[#F0EFE8] text-[#1A1915] border border-transparent hover:opacity-[0.88] ' +
    'min-h-[44px] px-6 py-2.5 text-[13px]',
  secondary:
    'bg-transparent text-[#F0EFE8] border border-[rgba(240,239,232,0.14)] hover:bg-[rgba(240,239,232,0.05)] ' +
    'min-h-[44px] px-6 py-2.5 text-[13px]',
  primaryAccent:
    'bg-[#F0EFE8] text-[#1A1915] border border-transparent hover:opacity-[0.88] ' +
    'min-h-[44px] px-6 py-2.5 text-[13px]',
  ghost:
    'bg-transparent text-[#A09E97] border border-transparent hover:text-[#F0EFE8] hover:bg-[rgba(240,239,232,0.05)] ' +
    'min-h-[40px] px-4 py-2 text-[13px] rounded-full',
  danger:
    'bg-[#222219] text-[#D9714A] border border-[rgba(240,239,232,0.14)] hover:bg-[#2C2C27] ' +
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
