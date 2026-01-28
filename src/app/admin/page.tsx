export default async function AdminDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-neutral-500">
          Review pending listings and moderate content.
        </p>
      </header>
      <section className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
        Moderation queue and stats will appear here.
      </section>
    </main>
  );
}

