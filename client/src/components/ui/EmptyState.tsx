interface EmptyStateProps {
  message: string;
  className?: string;
}

export default function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex-1 flex items-center justify-center py-20 ${className}`}>
      <p className="font-dm text-text-muted text-[15px]">{message}</p>
    </div>
  );
}
