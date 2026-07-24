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

/**
 * Map Stripe Subscription.status → our platform membershipStatus.
 * https://docs.stripe.com/api/subscriptions/object#subscription_object-status
 */
export function membershipStatusFromStripe(
  stripeStatus: string,
): MembershipStatus {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
    case "paused":
      return "none";
    default:
      return "none";
  }
}

/** Human-readable label for the membership UI. */
export function membershipLabel(status: MembershipStatus): string {
  switch (status) {
    case "active":
      return "Plus active";
    case "past_due":
      return "Payment past due";
    case "canceled":
      return "Canceled";
    case "none":
      return "Free account";
  }
}
