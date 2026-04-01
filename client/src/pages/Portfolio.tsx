import { useLocation } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import DenseCard from "@/components/ui/DenseCard";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import { useHouses } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { formatRand } from "@/lib/utils";

export default function Portfolio() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: houses, isLoading } = useHouses();

  const totalValue = houses?.reduce((sum, h) => sum + (h.total_value || 0), 0) ?? 0;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title=""
        color="green"
        right={user ? <Avatar name={user.name} size="md" /> : undefined}
      >
        <Logo size="sm" variant="white" className="mb-2" />
        <p className="font-poppins font-bold text-2xl text-white">{formatRand(totalValue)}</p>
        <p className="font-dm text-sm text-white/80">Total Portfolio Value</p>
      </PageHeader>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-grey-bg rounded-xl" />
            ))}
          </div>
        ) : houses?.length ? (
          <div className="flex flex-col gap-3">
            {houses.map((house, i) => (
              <div key={house.id} className="animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                <DenseCard
                  title={house.name}
                  subtitle={house.address}
                  value={formatRand(house.total_value)}
                  badge={`${house.total_items} items`}
                  thumbnail={house.image}
                  onClick={() => navigate(`/house/${house.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No properties yet" />
        )}
      </div>
    </div>
  );
}
