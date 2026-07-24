import Link from "next/link";

export default async function StoreBrowsePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm uppercase tracking-wide text-stone-500">
        Store catalog
      </p>
      <h1 className="font-serif text-4xl">/{storeSlug}</h1>
      <p className="text-stone-600">
        Product browse lands in phase 2.{" "}
        <Link href="/" className="underline">
          Back to stores
        </Link>
      </p>
    </div>
  );
}
