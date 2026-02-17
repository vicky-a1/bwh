import { cn } from "@/lib/cn";

type CardProps = React.PropsWithChildren<{
  className?: string;
}>;

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/10 bg-slate-900/40 p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

