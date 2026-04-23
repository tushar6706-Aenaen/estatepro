"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialNotice,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";

type FavoriteItem = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  imageUrl?: string | null;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("favorites");
    if (!raw) {
      setFavorites([]);
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as FavoriteItem[];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavorites([]);
    } finally {
      setReady(true);
    }
  }, []);

  const removeFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className={`${editorialPageRootClass} min-h-screen bg-[#f2eee3] pb-20 md:pb-0`}>
      <div className="relative isolate overflow-hidden">
        <EditorialBackdrop
          radialClassName="absolute inset-0 left-0 w-full translate-x-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.1),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(234,88,12,0.1),transparent_45%)]"
          gridClassName="absolute inset-0 left-0 w-full translate-x-0 opacity-[0.08]"
        />
        <HomeHeader />

        <main className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <EditorialCard className="rounded-[1.6rem] bg-white/80 p-5 shadow-none md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Saved Collection
                </p>
                <h1 className="mt-2 font-serif text-3xl text-zinc-950 md:text-4xl">My Favorites</h1>
                <p className="mt-2 text-sm text-zinc-600">
                  Properties you marked as favorites from the listing cards.
                </p>
              </div>
              <div className="text-sm font-semibold text-zinc-700">
                {ready ? `${favorites.length} saved` : "Loading..."}
              </div>
            </div>
          </EditorialCard>

          {ready && favorites.length === 0 && (
            <EditorialNotice className="mt-6 border-zinc-200 bg-white px-8 py-10 text-center text-zinc-600">
              No favorites yet. Go to the home listings and tap the heart icon to save properties.
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-zinc-900/15 bg-[#f8f3e7] px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900/30 hover:bg-[#f1ead8]"
                >
                  Browse properties
                </Link>
              </div>
            </EditorialNotice>
          )}

          {ready && favorites.length > 0 && (
            <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-zinc-900/10 bg-white shadow-sm"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-200">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="line-clamp-1 text-lg font-semibold text-zinc-900">{item.title}</h2>
                      <p className="mt-1 text-sm text-zinc-600">{item.city}</p>
                    </div>
                    <p className="text-base font-semibold text-zinc-900">
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/properties/${item.id}`}
                        className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                      >
                        View property
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFavorite(item.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
