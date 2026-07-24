function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-stone-600">Customer list arrives in a later phase.</p>
    </div>
  );
}

export default function AdminCustomersPage() {
  return <AdminPlaceholder title="Customers" />;
}
