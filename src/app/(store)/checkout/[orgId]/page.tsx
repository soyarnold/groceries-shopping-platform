import Link from "next/link";

export default async function CheckoutPlaceholderPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-4xl">Checkout</h1>
      <p className="text-stone-600">
        Stripe Checkout for store <code className="text-sm">{orgId}</code>{" "}
        arrives in phase 4.
      </p>
      <Link href="/cart" className="underline">
        Back to cart
      </Link>
    </div>
  );
}
