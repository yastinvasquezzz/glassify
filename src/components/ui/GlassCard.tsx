import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = true,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl p-3.5 bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-2xl border border-white/10 transition-all duration-300 relative group cursor-pointer shadow-xl',
          hoverEffect && 'hover:-translate-y-1.5 hover:border-emerald-400/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]',
          className
        )
      )}
      {...props}
    >
      <div className="absolute -top-20 -right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all duration-500 pointer-events-none" />
      {children}
    </div>
  );
};
