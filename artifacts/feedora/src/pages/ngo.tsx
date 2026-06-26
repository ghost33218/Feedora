import { useQueryClient } from "@tanstack/react-query";
import {
  useListFoodPosts,
  useListClaims,
  useClaimFoodPost,
  getListFoodPostsQueryKey,
  getListClaimsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Nav } from "@/components/nav";
import { FoodPostCard } from "@/components/food-post-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Clock, Inbox } from "lucide-react";

export default function NgoDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading: postsLoading } = useListFoodPosts(
    { status: "pending" },
    { query: { queryKey: getListFoodPostsQueryKey({ status: "pending" }) } }
  );

  const { data: claimsData, isLoading: claimsLoading } = useListClaims({
    query: { queryKey: getListClaimsQueryKey() },
  });

  const claimPost = useClaimFoodPost();

  const availablePosts = postsData?.posts ?? [];
  const myClaims = claimsData?.claims ?? [];
  const activeClaims = myClaims.filter((c) => c.status !== "delivered" && c.status !== "cancelled");
  const completedClaims = myClaims.filter((c) => c.status === "delivered");

  const handleClaim = (postId: number) => {
    claimPost.mutate({ id: postId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFoodPostsQueryKey({ status: "pending" }) });
        queryClient.invalidateQueries({ queryKey: getListClaimsQueryKey() });
        toast({ title: "Food claimed!", description: "A volunteer will be assigned for pickup." });
      },
      onError: () => {
        toast({
          title: "Could not claim",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">NGO Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{user?.organizationName ?? user?.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-600">{availablePosts.length}</div>
            <div className="text-sm text-muted-foreground">Available Now</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{activeClaims.length}</div>
            <div className="text-sm text-muted-foreground">Active Claims</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{completedClaims.length}</div>
            <div className="text-sm text-muted-foreground">Received</div>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Available Food Posts
          </h2>
          {postsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : availablePosts.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
              <p>No food available right now. Check back soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {availablePosts.map((post) => (
                <FoodPostCard
                  key={post.id}
                  post={post}
                  actions={
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => handleClaim(post.id)}
                      disabled={claimPost.isPending}
                    >
                      Claim
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active Claims
          </h2>
          {claimsLoading ? (
            <div className="text-center py-6 text-muted-foreground">Loading...</div>
          ) : activeClaims.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No active claims.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {activeClaims.map((claim) => (
                claim.foodPost && (
                  <div key={claim.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-sm capitalize">{claim.foodPost.foodType.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground">{claim.foodPost.quantity} {claim.foodPost.unit}</div>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                    {claim.volunteerName && (
                      <div className="text-xs text-muted-foreground mb-2">Volunteer: {claim.volunteerName}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{claim.foodPost.address}</div>
                  </div>
                )
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Completed Deliveries
          </h2>
          {completedClaims.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No completed deliveries yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {completedClaims.map((claim) => (
                claim.foodPost && (
                  <div key={claim.id} className="bg-card border border-border rounded-xl p-5 opacity-75">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm capitalize">{claim.foodPost.foodType.replace("_", " ")}</div>
                      <StatusBadge status={claim.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">{claim.foodPost.quantity} {claim.foodPost.unit}</div>
                    {claim.deliveredAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Delivered {new Date(claim.deliveredAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
