import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50 active:scale-95 cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3.5 gap-3',
  };

  const variantClasses = {
    glass: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20 shadow-lg',
    primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-[0_0_25px_rgba(29,185,84,0.7)] hover:shadow-[0_0_35px_rgba(0,242,254,0.9)] hover:scale-105',
    ghost: 'text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl',
    icon: 'p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15',
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
      {...props}
    >
      {children}
    </button>
  );
};
