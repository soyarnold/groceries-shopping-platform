export type MembershipStatus = "none" | "active" | "past_due" | "canceled";

export function isMembershipActive(status: MembershipStatus): boolean {
  return status === "active";
}

/** Prefer member price when membership is active and a member price exists. */
export function resolvePriceCents(args: {
  priceCents: number;
  memberPriceCents?: number;
  membershipStatus: MembershipStatus;
}): number {
  if (
    isMembershipActive(args.membershipStatus) &&
    args.memberPriceCents !== undefined
  ) {
    return args.memberPriceCents;
  }
  return args.priceCents;
}
