import { useLocation } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import DenseCard from "@/components/ui/DenseCard";
import EmptyState from "@/components/ui/EmptyState";
import { useItems } from "@/lib/queries";
import { formatRand } from "@/lib/utils";

export default function Inventory() {
  const [, navigate] = useLocation();
  const { data: items, isLoading } = useItems();

  const totalValue = items?.reduce((sum, i) => sum + (i.amount * (i.price ? Number(i.price) : 0)), 0) ?? 0;
  const totalItems = items?.length ?? 0;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="All Items"
        subtitle={`${totalItems} items - ${formatRand(totalValue)}`}
        color="green"
      />

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-grey-bg rounded-xl" />)}
          </div>
        ) : items?.length ? (
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={item.id} className="animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                <DenseCard
                  title={`${item.brand} ${item.model}`}
                  subtitle={item.category}
                  value={formatRand(item.price)}
                  badge={item.amount > 1 ? `x${item.amount}` : undefined}
                  thumbnail={item.image}
                  onClick={() => navigate(`/item/${item.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No items yet" />
        )}
      </div>
    </div>
  );
}
