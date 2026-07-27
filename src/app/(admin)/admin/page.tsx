"use client";

import { useOrganization } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";

export default function AdminDashboardPage() {
  const { organization, isLoaded } = useOrganization();
  const { isAuthenticated } = useConvexAuth();
  const store = useQuery(api.stores.getMine, isAuthenticated ? {} : "skip");
  const authContext = useQuery(
    api.stores.getAuthContext,
    isAuthenticated ? {} : "skip",
  );
  const ensureUser = useMutation(api.users.ensure);
  const ensureStore = useMutation(api.stores.ensureFromActiveOrg);
  const seedCatalog = useMutation(api.seed.seedDemoCatalog);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void ensureUser({});
  }, [ensureUser, isAuthenticated]);

  async function bootstrapStore() {
    if (!organization) {
      return;
    }
    setBootstrapping(true);
    setError(null);
    try {
      await ensureUser();
      await ensureStore({
        name: organization.name,
        description: `${organization.name} grocery store`,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to bootstrap store",
      );
    } finally {
      setBootstrapping(false);
    }
  }

  async function onSeed(force: boolean) {
    setSeeding(true);
    setError(null);
    setSeedMessage(null);
    try {
      const result = await seedCatalog({ force });
      if (result.skipped) {
        setSeedMessage(
          "Catalog already has products. Use “Force re-seed” to add another demo set.",
        );
      } else {
        setSeedMessage(
          `Seeded ${result.productCount} products across ${result.categoryCount} categories (${result.withMemberPrice} with member pricing).`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  if (!isLoaded) {
    return <p className="text-stone-500">Loading organization…</p>;
  }

  if (!organization) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Select a store org</h1>
        <p className="text-stone-600">
          Use the organization switcher above, or{" "}
          <a href="/admin/select-org" className="underline">
            create one
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">{organization.name}</h1>
        <p className="mt-2 text-stone-600">
          Store admin — catalog, inventory, and orders for this organization.
        </p>
      </div>

      {organization && authContext && !authContext.orgId ? (
        <div className="border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Clerk has org <span className="font-mono">{organization.id}</span>{" "}
          selected, but Convex auth has no org claim. Re-select the org in the
          switcher (or sign out/in), and confirm the Clerk{" "}
          <span className="font-mono">convex</span> JWT template includes{" "}
          <span className="font-mono">org_id</span> /{" "}
          <span className="font-mono">org_role</span>. Seed and store bootstrap
          will fail until this is fixed.
        </div>
      ) : null}
      {store === undefined ? (
        <p className="text-stone-500">Loading store record…</p>
      ) : store === null ? (
        <div className="border border-dashed border-stone-400 bg-white p-4">
          <p className="text-stone-700">
            No Convex store linked to this organization yet.
          </p>
          <button
            type="button"
            onClick={() => void bootstrapStore()}
            disabled={bootstrapping}
            className="mt-3 border border-stone-800 bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {bootstrapping ? "Creating…" : "Create store record"}
          </button>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>
      ) : (
        <>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Slug</dt>
              <dd className="font-medium">
                <Link href={`/s/${store.slug}`} className="underline">
                  /s/{store.slug}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Org ID</dt>
              <dd className="font-mono text-xs">{store.orgId}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Status</dt>
              <dd>{store.active ? "Active" : "Inactive"}</dd>
            </div>
          </dl>

          <div className="border border-stone-300 bg-white/80 p-4">
            <h2 className="font-medium">Demo catalog</h2>
            <p className="mt-1 text-sm text-stone-600">
              Insert Produce, Dairy, and Pantry sample products with inventory
              and member prices. Skips if products already exist.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={seeding}
                onClick={() => void onSeed(false)}
                className="border border-stone-900 bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {seeding ? "Seeding…" : "Seed demo catalog"}
              </button>
              <button
                type="button"
                disabled={seeding}
                onClick={() => void onSeed(true)}
                className="border border-stone-400 px-4 py-2 text-sm disabled:opacity-50"
              >
                Force re-seed
              </button>
            </div>
            {seedMessage ? (
              <p className="mt-2 text-sm text-stone-700">{seedMessage}</p>
            ) : null}
            {error ? (
              <p className="mt-2 text-sm text-red-700">{error}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
