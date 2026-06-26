import {
  useGetImpactSummary,
  useGetRecentActivity,
  useGetImpactByFoodType,
  useListVolunteers,
  useListNgos,
  getGetImpactSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getGetImpactByFoodTypeQueryKey,
  getListVolunteersQueryKey,
  getListNgosQueryKey,
} from "@workspace/api-client-react";
import { Nav } from "@/components/nav";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, Package, Truck, Leaf } from "lucide-react";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const foodTypeLabels: Record<string, string> = {
  cooked_meal: "Cooked Meal",
  raw_produce: "Raw Produce",
  packaged_food: "Packaged",
  bakery: "Bakery",
  dairy: "Dairy",
  beverages: "Beverages",
  other: "Other",
};

const activityIcons: Record<string, string> = {
  post_created: "Posted",
  post_claimed: "Claimed",
  pickup_done: "Picked Up",
  delivery_done: "Delivered",
};

export default function ImpactDashboard() {
  const { data: summary } = useGetImpactSummary({ query: { queryKey: getGetImpactSummaryQueryKey() } });
  const { data: activityData } = useGetRecentActivity({ limit: 15 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 15 }) } });
  const { data: foodTypeData } = useGetImpactByFoodType({ query: { queryKey: getGetImpactByFoodTypeQueryKey() } });
  const { data: volunteersData } = useListVolunteers({ query: { queryKey: getListVolunteersQueryKey() } });
  const { data: ngosData } = useListNgos({ query: { queryKey: getListNgosQueryKey() } });

  const chartData = (foodTypeData?.breakdown ?? []).map((b) => ({
    name: foodTypeLabels[b.foodType] ?? b.foodType,
    value: b.count,
    servings: b.servings,
  }));

  const activities = activityData?.activities ?? [];
  const volunteers = volunteersData?.volunteers ?? [];
  const ngos = ngosData?.ngos ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Live Impact Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time food rescue metrics</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Leaf className="w-5 h-5" />} value={(summary?.totalMealsSaved ?? 0).toLocaleString()} label="Meals Saved" color="text-green-600" />
          <StatCard icon={<Package className="w-5 h-5" />} value={(summary?.totalDonations ?? 0).toLocaleString()} label="Total Donations" color="text-blue-600" />
          <StatCard icon={<Truck className="w-5 h-5" />} value={(summary?.totalDelivered ?? 0).toLocaleString()} label="Delivered" color="text-purple-600" />
          <StatCard icon={<Users className="w-5 h-5" />} value={((summary?.co2AvoidedKg) ?? 0).toFixed(1)} label="kg CO2 Avoided" color="text-amber-600" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold">{(summary?.totalNgos) ?? 0}</div>
            <div className="text-sm text-muted-foreground">Partner NGOs</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold">{(summary?.activePosts) ?? 0}</div>
            <div className="text-sm text-muted-foreground">Active Posts Right Now</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">Food Type Breakdown</h2>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">Servings by Food Type</h2>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="servings" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">Recent Activity</h2>
            {activities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No activity yet</div>
            ) : (
              <div className="space-y-3">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.type === "delivery_done" ? "bg-green-100 text-green-700"
                        : a.type === "pickup_done" ? "bg-purple-100 text-purple-700"
                        : a.type === "post_claimed" ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>{activityIcons[a.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold mb-4">Top NGOs</h2>
              {ngos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No NGOs yet</div>
              ) : (
                <div className="space-y-2">
                  {ngos.sort((a, b) => b.totalClaimsCompleted - a.totalClaimsCompleted).slice(0, 5).map((ngo) => (
                    <div key={ngo.id} className="flex items-center justify-between">
                      <span className="text-sm">{ngo.organizationName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{ngo.totalClaimsCompleted} pickups</span>
                        <span className="text-xs font-medium text-green-600">{ngo.reliabilityScore.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold mb-4">Top Volunteers</h2>
              {volunteers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No volunteers yet</div>
              ) : (
                <div className="space-y-2">
                  {volunteers.sort((a, b) => b.totalDeliveries - a.totalDeliveries).slice(0, 5).map((vol) => (
                    <div key={vol.id} className="flex items-center justify-between">
                      <span className="text-sm">{vol.name}</span>
                      <span className="text-xs text-muted-foreground">{vol.totalDeliveries} deliveries</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
