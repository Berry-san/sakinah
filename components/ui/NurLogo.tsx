import { cn } from '@/lib/utils';

/** Crescent moon + star SVG mark for Nur */
export function NurLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <mask id="nur-crescent-mask">
          <circle cx="15" cy="16" r="13" fill="white" />
          <circle cx="21" cy="11" r="10" fill="black" />
        </mask>
      </defs>
      {/* Crescent moon */}
      <circle cx="15" cy="16" r="13" fill="currentColor" mask="url(#nur-crescent-mask)" />
      {/* Star */}
      <circle cx="25" cy="22" r="2.5" fill="currentColor" />
    </svg>
  );
}

interface NurLogoProps {
  className?: string;
  showArabic?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NurLogo({ className, showArabic = true, size = 'md' }: NurLogoProps) {
  const sizes = {
    sm: { mark: 'w-5 h-5', name: 'text-sm', arabic: 'text-xs' },
    md: { mark: 'w-7 h-7', name: 'text-base', arabic: 'text-xs' },
    lg: { mark: 'w-10 h-10', name: 'text-2xl', arabic: 'text-sm' }
  };

  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <NurLogoMark className={cn(s.mark, 'text-green-600 dark:text-green-400')} />
      <div className="flex items-baseline gap-1.5">
        <span className={cn('font-clash font-bold tracking-tight text-foreground', s.name)}>
          Nur
        </span>
        {showArabic && (
          <span
            className={cn('text-green-600/60 dark:text-green-400/60 leading-none', s.arabic)}
            style={{ fontFamily: "'Amiri', serif" }}
          >
            نور
          </span>
        )}
      </div>
    </div>
  );
}
