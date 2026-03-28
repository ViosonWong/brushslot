import { cn } from "@/lib/cn";

export function PageShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-screen-xl px-4 py-6", className)}>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-zinc-600">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}

