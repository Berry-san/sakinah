import { cn } from '@/lib/utils';

interface SakinahLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizes = {
  xs: { w: 90, h: 41 },
  sm: { w: 120, h: 55 },
  md: { w: 160, h: 73 },
  lg: { w: 220, h: 100 }
};

export function SakinahLogo({ className, size = 'md' }: SakinahLogoProps) {
  const { w, h } = sizes[size];
  return (
    <img
      src="/sakinah-logo.svg"
      alt="Sakinah"
      width={w}
      height={h}
      className={cn(
        'select-none object-contain',
        /* green logo stays readable on dark backgrounds; mild brightness lift helps */
        'dark:brightness-[1.2]',
        className
      )}
      draggable={false}
    />
  );
}
