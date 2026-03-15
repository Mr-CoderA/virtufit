'use client';

function getInitial(name: string | null, email: string): string {
  if (name?.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  return email.trim().charAt(0).toUpperCase();
}

interface AvatarProps {
  name: string | null;
  email: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[13px]',
  md: 'h-10 w-10 text-[15px]',
  lg: 'h-14 w-14 text-[17px]',
};

export function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
  const initial = getInitial(name, email);
  return (
    <div
      className={
        `inline-flex items-center justify-center rounded-full font-medium text-[#F0EFE8] ` +
        `bg-[#2C2C27] border border-[rgba(240,239,232,0.08)] ` +
        `${sizeClasses[size]} ${className}`
      }
      title={name || email}
    >
      {initial}
    </div>
  );
}
