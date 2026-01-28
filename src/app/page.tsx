export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-16">
      <section className="flex flex-col gap-4">
        <p className="text-sm font-medium text-blue-600">Modern real-estate MVP</p>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Find your next home with a clean, fast marketplace.
        </h1>
        <p className="max-w-2xl text-base text-neutral-600">
          Browse curated listings, talk directly with trusted agents, and let admins
          keep the marketplace safe and up to date.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
          <h2 className="mb-1 text-base font-semibold">For buyers & renters</h2>
          <p className="text-neutral-600">
            Search approved properties by city, price, and type, then contact agents
            via phone, inquiry form, or real-time chat.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
          <h2 className="mb-1 text-base font-semibold">For agents</h2>
          <p className="text-neutral-600">
            Create and manage your listings from a focused dashboard and respond to
            leads in one place.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
          <h2 className="mb-1 text-base font-semibold">For admins</h2>
          <p className="text-neutral-600">
            Review and approve listings before they go live, keeping the marketplace
            high-quality and secure.
          </p>
        </div>
      </section>
    </main>
  );
}
