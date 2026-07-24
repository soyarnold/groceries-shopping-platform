"use client";

import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";

export default function AdminDashboardPage() {
  const { organization, isLoaded } = useOrganization();
  const store = useQuery(api.stores.getMine);
  const ensureUser = useMutation(api.users.ensure);
  const ensureStore = useMutation(api.stores.ensureFromActiveOrg);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void ensureUser().catch(() => undefined);
  }, [ensureUser]);

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
          Admin dashboard shell — catalog tools arrive in phase 2.
        </p>
      </div>

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
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Slug</dt>
            <dd className="font-medium">/{store.slug}</dd>
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
      )}
    </div>
  );
}
