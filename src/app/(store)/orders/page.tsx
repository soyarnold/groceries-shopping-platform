function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-serif text-4xl">{title}</h1>
      <p className="text-stone-600">Coming in a later phase.</p>
    </div>
  );
}

export default function OrdersPage() {
  return <Placeholder title="Orders" />;
}
