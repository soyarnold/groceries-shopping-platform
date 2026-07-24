function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-stone-600">Orders admin arrives in phase 4.</p>
    </div>
  );
}

export default function AdminOrdersPage() {
  return <AdminPlaceholder title="Orders" />;
}
