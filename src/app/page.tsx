"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 font-sans dark:bg-black">
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Sign in to use Convex with Clerk.
        </p>
        <SignInButton />
      </Unauthenticated>
    </div>
  );
}

function Content() {
  const messages = useQuery(api.messages.getForCurrentUser);
  return (
    <div className="text-lg text-zinc-900 dark:text-zinc-50">
      Authenticated content: {messages?.length ?? "…"} messages
    </div>
  );
}
