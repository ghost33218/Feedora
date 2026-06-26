import { useQueryClient } from "@tanstack/react-query";
import {
  useListClaims,
  useListFoodPosts,
  useMarkPickup,
  useMarkDelivery,
  getListClaimsQueryKey,
  getListFoodPostsQueryKey,
  getGetImpactSummaryQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Truck, CheckCircle2 } from "lucide-react";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claimsData, isLoading } = useListClaims({
    query: { queryKey: getListClaimsQueryKey() },
  });

  const { data: allPostsData } = useListFoodPosts(
    { status: "claimed" },
    { query: { queryKey: getListFoodPostsQueryKey({ status: "claimed" }) } }
  );

  const markPickup = useMarkPickup();
  const markDelivery = useMarkDelivery();

  const myClaims = claimsData?.claims ?? [];
  const pendingPickups = myClaims.filter((c) => c.status === "claimed");
  const inTransit = myClaims.filter((c) => c.status === "picked_up");
  const delivered = myClaims.filter((c) => c.status === "delivered");

  const availablePickups = (allPostsData?.posts ?? []).filter(
    (p) => !myClaims.some((c) => c.postId === p.id)
  );

  const handlePickup = (claimId: number) => {
    markPickup.mutate({ id: claimId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClaimsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListFoodPostsQueryKey({ status: "claimed" }) });
        toast({ title: "Pickup recorded!", description: "Head to the NGO to complete delivery." });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleDeliver = (claimId: number) => {
    markDelivery.mutate({ id: claimId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClaimsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetImpactSummaryQueryKey() });
        toast({ title: "Delivery complete!", description: "Meals have been saved." });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome, {user?.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{pendingPickups.length}</div>
            <div className="text-sm text-muted-foreground">Pending Pickups</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">{inTransit.length}</div>
            <div className="text-sm text-muted-foreground">In Transit</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{delivered.length}</div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            {inTransit.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" />
                  In Transit — Mark Delivered
                </h2>
                <div className="space-y-3">
                  {inTransit.map((claim) => (
                    <div key={claim.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm">{claim.foodPost?.foodType?.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">For: {claim.ngoName}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />{claim.foodPost?.address}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={claim.status} />
                        <Button size="sm" onClick={() => handleDeliver(claim.id)} disabled={markDelivery.isPending}>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-8">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                My Assigned Pickups
              </h2>
              {pendingPickups.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                  <p>No pickups assigned yet. Complete pickups from available food below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPickups.map((claim) => (
                    <div key={claim.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm capitalize">{claim.foodPost?.foodType?.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground">{claim.foodPost?.quantity} {claim.foodPost?.unit} — for {claim.ngoName}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />{claim.foodPost?.address}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={claim.status} />
                        <Button variant="outline" size="sm" onClick={() => handlePickup(claim.id)} disabled={markPickup.isPending}>
                          <Truck className="w-4 h-4 mr-1.5" />
                          Mark Picked Up
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {availablePickups.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-semibold mb-4">Available for Pickup</h2>
                <div className="space-y-3">
                  {availablePickups.slice(0, 5).map((post) => (
                    <div key={post.id} className="bg-muted/50 border border-border rounded-xl p-5 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm capitalize">{post.foodType.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground">{post.quantity} {post.unit} — claimed by {post.claimedByNgoName ?? "an NGO"}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />{post.address}
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Completed Deliveries
              </h2>
              {delivered.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No deliveries yet.</div>
              ) : (
                <div className="space-y-2">
                  {delivered.map((claim) => (
                    <div key={claim.id} className="bg-card/50 border border-border rounded-lg p-4 flex items-center justify-between opacity-75">
                      <div>
                        <div className="text-sm font-medium capitalize">{claim.foodPost?.foodType?.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground">To: {claim.ngoName}</div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={claim.status} />
                        {claim.deliveredAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(claim.deliveredAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
