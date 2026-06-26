import { useParams } from "wouter";
import {
  useGetFoodPost,
  useGetMatchedNgos,
  useClaimFoodPost,
  getGetFoodPostQueryKey,
  getGetMatchedNgosQueryKey,
  getListFoodPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Package, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const foodTypeLabels: Record<string, string> = {
  cooked_meal: "Cooked Meal", raw_produce: "Raw Produce", packaged_food: "Packaged Food",
  bakery: "Bakery", dairy: "Dairy", beverages: "Beverages", other: "Other",
};

export default function PostDetail() {
  const { id } = useParams();
  const postId = parseInt(id ?? "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading } = useGetFoodPost(postId, {
    query: { enabled: !!postId, queryKey: getGetFoodPostQueryKey(postId) },
  });

  const { data: matchData } = useGetMatchedNgos(postId, {
    query: { enabled: !!postId && post?.status === "pending", queryKey: getGetMatchedNgosQueryKey(postId) },
  });

  const claimPost = useClaimFoodPost();

  const handleClaim = () => {
    claimPost.mutate({ id: postId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFoodPostQueryKey(postId) });
        queryClient.invalidateQueries({ queryKey: getListFoodPostsQueryKey() });
        toast({ title: "Claimed!", description: "You've claimed this food post." });
      },
      onError: () => toast({ title: "Failed to claim", variant: "destructive" }),
    });
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Food post not found.</p>
          <Link href="/"><Button variant="outline">Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const expiresAt = post.expiresAt ? new Date(post.expiresAt) : null;
  const timeLeft = expiresAt ? Math.max(0, expiresAt.getTime() - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const isUrgent = timeLeft < 2 * 60 * 60 * 1000;

  const matches = matchData?.matches ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{foodTypeLabels[post.foodType] ?? post.foodType}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Posted by {post.donorName}</p>
            </div>
            <StatusBadge status={post.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Quantity</div>
              <div className="font-semibold">{post.quantity} {post.unit}</div>
            </div>
            {post.servings && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Servings</div>
                <div className="font-semibold">{post.servings} people</div>
              </div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{post.address}</span>
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {timeLeft === 0 ? "Expired" : `${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minutesLeft}m remaining`}
              </span>
            </div>
            {post.notes && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{post.notes}</span>
              </div>
            )}
          </div>

          {post.status === "pending" && user?.role === "ngo" && (
            <Button className="w-full" onClick={handleClaim} disabled={claimPost.isPending}>
              {claimPost.isPending ? "Claiming..." : "Claim This Food"}
            </Button>
          )}
          {post.claimedByNgoName && (
            <div className="text-sm text-muted-foreground bg-blue-50 rounded-lg px-4 py-2 mt-2">
              Claimed by: <span className="font-medium text-blue-800">{post.claimedByNgoName}</span>
            </div>
          )}
        </div>

        {matches.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-semibold mb-1">AI-Matched NGOs</h2>
            <p className="text-xs text-muted-foreground mb-4">Ranked by distance, urgency, and reliability</p>
            <div className="space-y-3">
              {matches.map((match, i) => (
                <div key={match.ngo.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${i === 0 ? "bg-green-600" : i === 1 ? "bg-blue-600" : "bg-gray-500"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{match.ngo.organizationName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{match.reason}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold">{match.score}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{match.ngo.totalClaimsCompleted} pickups</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
