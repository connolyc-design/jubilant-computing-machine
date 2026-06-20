"use client";

/**
 * Global error boundary. Instead of the raw "Application error" white screen,
 * show a friendly bilingual message with a retry. Kept dependency-free (no
 * next-intl) so it renders even if something upstream failed.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-extrabold text-pitch">La Quiniela</h1>
      <p className="mt-4 text-sm text-neutral-700">
        Algo salió mal al cargar esta página.
        <br />
        <span className="text-neutral-500">Something went wrong loading this page.</span>
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-pitch px-5 py-3 text-sm font-semibold text-white"
      >
        Reintentar / Retry
      </button>
      {error?.digest && (
        <p className="mt-4 text-xs text-neutral-400">ref: {error.digest}</p>
      )}
    </div>
  );
}
