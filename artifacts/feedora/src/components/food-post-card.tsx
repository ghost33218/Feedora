import { Link } from "wouter";
import { FoodPost } from "@workspace/api-client-react";
import { StatusBadge } from "./status-badge";
import { Clock, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

function useCountdown(expiresAt: string) {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expiry - now;
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

const foodTypeLabels: Record<string, string> = {
  cooked_meal: "Cooked Meal",
  raw_produce: "Raw Produce",
  packaged_food: "Packaged Food",
  bakery: "Bakery",
  dairy: "Dairy",
  beverages: "Beverages",
  other: "Other",
};

interface FoodPostCardProps {
  post: FoodPost;
  actions?: React.ReactNode;
}

export function FoodPostCard({ post, actions }: FoodPostCardProps) {
  const countdown = useCountdown(post.expiresAt ?? new Date().toISOString());
  const isUrgent = new Date(post.expiresAt ?? "").getTime() - Date.now() < 2 * 60 * 60 * 1000;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{foodTypeLabels[post.foodType] ?? post.foodType}</span>
            <StatusBadge status={post.status} />
          </div>
          <div className="text-xs text-muted-foreground">{post.donorName}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-foreground">{post.quantity} {post.unit}</div>
          {post.servings && <div className="text-xs text-muted-foreground">{post.servings} servings</div>}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{post.address}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{countdown}</span>
        </div>
        {post.notes && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Package className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{post.notes}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/post/${post.id}`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2">View Details</Button>
        </Link>
        {actions}
      </div>
    </div>
  );
}
