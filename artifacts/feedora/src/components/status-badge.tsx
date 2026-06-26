import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-800 border-amber-200" },
  claimed: { label: "Claimed", classes: "bg-blue-100 text-blue-800 border-blue-200" },
  in_transit: { label: "In Transit", classes: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Delivered", classes: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-600 border-gray-200" },
  expired: { label: "Expired", classes: "bg-red-100 text-red-700 border-red-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? { label: status, classes: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.classes)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
}
