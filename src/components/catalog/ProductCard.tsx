import Link from "next/link";
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

  return (
    <Link
      href={`/s/${props.storeSlug}/p/${props.slug}`}
      className="block border border-stone-300 bg-white/80 p-4 transition hover:border-stone-500"
    >
      <p className="text-xs uppercase tracking-wide text-stone-500">
        {props.categoryName}
      </p>
      <h3 className="mt-1 font-serif text-2xl">{props.name}</h3>
      <p className="mt-2 text-sm text-stone-600">per {props.unit}</p>
      <p className="mt-3 text-lg font-medium">
        {formatPriceCents(props.displayPriceCents)}
        {showCompare ? (
          <span className="ml-2 text-sm font-normal text-stone-500 line-through">
            {formatPriceCents(props.priceCents)}
          </span>
        ) : null}
      </p>
      {props.quantity !== null ? (
        <p className="mt-1 text-xs text-stone-500">
          {props.quantity > 0 ? `${props.quantity} in stock` : "Out of stock"}
        </p>
      ) : null}
    </Link>
  );
}
