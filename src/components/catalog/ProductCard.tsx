import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPriceCents } from "../../../convex/lib/catalog";

type ProductCardProps = {
  storeSlug: string;
  name: string;
  slug: string;
  unit: string;
  displayPriceCents: number;
  priceCents: number;
  memberPriceCents?: number;
  quantity: number | null;
  categoryName: string;
};

export function ProductCard(props: ProductCardProps) {
  const showCompare =
    props.memberPriceCents !== undefined &&
    props.displayPriceCents !== props.priceCents;
  const outOfStock = props.quantity !== null && props.quantity < 1;

  return (
    <Link
      href={`/s/${props.storeSlug}/p/${props.slug}`}
      className="block no-underline"
    >
      <Card interactive className="h-full">
        <div className="flex items-start justify-between gap-2">
          <Badge>{props.categoryName}</Badge>
          {outOfStock ? <Badge tone="danger">Out of stock</Badge> : null}
          {!outOfStock && showCompare ? (
            <Badge tone="accent">Member</Badge>
          ) : null}
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
          {props.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">per {props.unit}</p>
        <p className="mt-4 text-lg font-semibold text-foreground">
          {formatPriceCents(props.displayPriceCents)}
          {showCompare ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
              {formatPriceCents(props.priceCents)}
            </span>
          ) : null}
        </p>
        {props.quantity !== null && !outOfStock ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {props.quantity} in stock
          </p>
        ) : null}
      </Card>
    </Link>
  );
}
