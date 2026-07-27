"use client";

import { useOrganization } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    return <p className="text-muted-foreground">Loading organization…</p>;
  }

  if (!organization) {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading as="h1" title="Select a store org" />
        <p className="text-muted-foreground">
          Use the organization switcher above, or{" "}
          <a
            href="/admin/select-org"
            className="font-medium text-primary underline"
          >
            create one
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        as="h1"
        title={organization.name}
        description="Catalog, inventory, and orders for this organization."
      />

      {organization && authContext && !authContext.orgId ? (
        <Card className="border-accent bg-accent/10">
          <p className="text-sm text-foreground">
            Clerk has org <span className="font-mono">{organization.id}</span>{" "}
            selected, but Convex auth has no org claim. Re-select the org in the
            switcher (or sign out/in), and confirm the Clerk{" "}
            <span className="font-mono">convex</span> JWT template includes{" "}
            <span className="font-mono">org_id</span> /{" "}
            <span className="font-mono">org_role</span>. Seed and store
            bootstrap will fail until this is fixed.
          </p>
        </Card>
      ) : null}
      {store === undefined ? (
        <p className="text-muted-foreground">Loading store record…</p>
      ) : store === null ? (
        <Card className="border-dashed">
          <p className="text-foreground">
            No Convex store linked to this organization yet.
          </p>
          <Button
            className="mt-3"
            onClick={() => void bootstrapStore()}
            disabled={bootstrapping}
          >
            {bootstrapping ? "Creating…" : "Create store record"}
          </Button>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        </Card>
      ) : (
        <>
          <Card>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="mt-1 font-medium">
                  <Link
                    href={`/s/${store.slug}`}
                    className="text-primary underline"
                  >
                    /s/{store.slug}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Org ID</dt>
                <dd className="mt-1 font-mono text-xs">{store.orgId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge tone={store.active ? "success" : "neutral"}>
                    {store.active ? "Active" : "Inactive"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Demo catalog
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Insert Produce, Dairy, and Pantry sample products with inventory
              and member prices. Skips if products already exist.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={seeding} onClick={() => void onSeed(false)}>
                {seeding ? "Seeding…" : "Seed demo catalog"}
              </Button>
              <Button
                variant="secondary"
                disabled={seeding}
                onClick={() => void onSeed(true)}
              >
                Force re-seed
              </Button>
            </div>
            {seedMessage ? (
              <p className="mt-2 text-sm text-foreground">{seedMessage}</p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          </Card>
        </>
      )}
    </div>
  );
}
