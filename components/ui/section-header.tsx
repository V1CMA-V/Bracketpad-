import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  eyebrow: string
  title: React.ReactNode
  italic?: string
  description?: string
  bullet?: boolean
  variant?: 'light' | 'dark'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  italic,
  description,
  bullet = false,
  variant = 'light',
  className,
}: SectionHeaderProps) {
  const isDark = variant === 'dark'

  return (
    <header
      className={cn(
        'flex flex-col gap-4 max-w-3xl',
        isDark && 'text-cream',
        className,
      )}
    >
      <p
        className={cn(
          'font-mono text-xs uppercase tracking-widest flex items-center gap-2',
          isDark ? 'text-cream/80' : 'text-muted-foreground',
        )}
      >
        {bullet && (
          <span
            className={cn(
              'inline-block size-1.5 rounded-full',
              isDark ? 'bg-lime' : 'bg-terracotta',
            )}
          />
        )}
        <span>{eyebrow}</span>
      </p>

      <h2
        className={cn(
          'font-serif font-normal leading-[1.05] tracking-tight text-4xl sm:text-5xl md:text-6xl',
          isDark ? 'text-cream' : 'text-foreground',
        )}
      >
        {title}
        {italic && (
          <>
            {' '}
            <span
              className={cn(
                'italic',
                isDark ? 'text-lime' : 'text-foreground/90',
              )}
            >
              {italic}
            </span>
          </>
        )}
        {isDark && <span className="text-cream">.</span>}
      </h2>

      {description && (
        <p
          className={cn(
            'text-base md:text-lg leading-snug max-w-xl',
            isDark ? 'text-cream/75' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>
      )}
    </header>
  )
}
