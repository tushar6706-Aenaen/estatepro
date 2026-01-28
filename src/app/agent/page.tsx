export default async function AgentDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Agent dashboard</h1>
        <p className="text-sm text-neutral-500">
          From here agents will manage their listings and conversations.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">
          Listings summary
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">
          Recent inquiries
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">
          Active chats
        </div>
      </section>
    </main>
  );
}

