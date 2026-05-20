import { cn } from '@/lib/utils';
import { HTMLMotionProps, motion } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({ children, className, intensity = 'medium', ...props }: GlassCardProps) {
  const intensityMap = {
    low: 'bg-card border-border/60',
    medium: 'bg-card border-border card-highlight',
    high: 'bg-card border-border card-highlight'
  };

  return (
    <motion.div className={cn('rounded-2xl border', intensityMap[intensity], className)} {...props}>
      {children}
    </motion.div>
  );
}
