import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className,
  glow = false,
  intensity = 'medium',
  ...props
}) => {
  const intensityClasses = {
    light: 'bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-xl',
    medium: 'bg-white/[0.05] backdrop-blur-2xl border-white/15 shadow-2xl',
    heavy: 'bg-white/[0.08] backdrop-blur-3xl border-white/20 shadow-2xl',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border transition-all duration-500',
          intensityClasses[intensity],
          glow && 'shadow-[0_0_35px_rgba(255,255,255,0.08)] hover:shadow-[0_0_45px_rgba(0,242,254,0.2)]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
