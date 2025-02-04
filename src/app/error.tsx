'use client'
export default function GlobalError({ error }: { error: Error & { digest?: string }; }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-3xl font-bold text-red-600">🚨 Interne serverfout</h1>
      <p className="mt-2 text-lg">Er is iets misgegaan in de server.</p>
      <div className="h-3 text-xl"></div>
      <p>Stacktrace:</p>
        <pre className="mt-4 p-4 bg-neutral-800 text-sm w-full max-w-3xl overflow-auto rounded-lg">
          {error.message}
          <br />
          {error.stack}
        </pre>
    </div>
  );
}
