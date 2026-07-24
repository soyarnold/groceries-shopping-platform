"use client";

import { CreateOrganization, OrganizationList } from "@clerk/nextjs";

export default function SelectOrgPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold">Choose or create a store</h1>
        <p className="mt-2 text-stone-600">
          Admin requires an active Clerk organization (one org = one store).
        </p>
      </div>
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/admin"
        afterCreateOrganizationUrl="/admin"
      />
      <div>
        <h2 className="text-lg font-medium">Create a new store organization</h2>
        <div className="mt-4">
          <CreateOrganization afterCreateOrganizationUrl="/admin" />
        </div>
      </div>
    </div>
  );
}
