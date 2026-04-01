interface SectionLabelProps {
  children: string;
  className?: string;
}

export default function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <p className={`font-dm text-[11px] font-medium text-text-muted uppercase tracking-wider ${className}`}>
      {children}
    </p>
  );
}
