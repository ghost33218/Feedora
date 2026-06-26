
import {
  useGetImpactSummary,
  useGetRecentActivity,
  useListFoodPosts,
  getGetImpactSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getListFoodPostsQueryKey,
} from "@workspace/api-client-react";
import { Nav } from "@/components/nav";
import { FoodPostCard } from "@/components/food-post-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Zap, Shield, Globe } from "lucide-react";

export default function Home() {
  const { data: summary, isLoading: summaryLoading } = useGetImpactSummary({
    query: { queryKey: getGetImpactSummaryQueryKey() },
  });
  const { data: activityData } = useGetRecentActivity(
    { limit: 5 },
    { query: { queryKey: getGetRecentActivityQueryKey({ limit: 5 }) } }
  );
  const { data: postsData } = useListFoodPosts(
    { status: "pending", limit: 4 },
    { query: { queryKey: getListFoodPostsQueryKey({ status: "pending", limit: 4 }) } }
  );

  const activities = activityData?.activities ?? [];
  const activePosts = postsData?.posts ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-20 pb-24 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Donation Network
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Rescue surplus food.<br />
              <span className="text-primary">Feed your community.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Feedora connects restaurants and donors with nearby NGOs and volunteers in real time — like a delivery app, but for donations.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href="/register" className="inline-block">
                <Button size="lg" className="rounded-full text-base h-12 px-7 shadow-lg shadow-primary/25">
                  Join the Network <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="/impact" className="inline-block">
                <Button size="lg" variant="outline" className="rounded-full text-base h-12 px-7">
                  See Impact
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Live Stats */}
        <section className="bg-foreground text-background py-16 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value={summaryLoading ? "..." : (summary?.totalMealsSaved ?? 0).toLocaleString()} label="Meals Saved" />
            <Stat value={summaryLoading ? "..." : `${(summary?.co2AvoidedKg ?? 0).toFixed(1)}`} label="kg CO2 Avoided" />
            <Stat value={summaryLoading ? "..." : (summary?.totalNgos ?? 0).toLocaleString()} label="Partner NGOs" />
            <Stat value={summaryLoading ? "..." : (summary?.activePosts ?? 0).toLocaleString()} label="Live Posts" />
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">How Feedora Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Leaf className="w-6 h-6" />}
                title="Donors Post in Seconds"
                desc="Restaurants and businesses post surplus food with type, quantity, and expiry window in one tap."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="AI Auto-Matches NGOs"
                desc="Our matching engine scores nearby NGOs by distance, urgency, and reliability — routing every post instantly."
              />
              <FeatureCard
                icon={<Shield className="w-6 h-6" />}
                title="End-to-End Tracking"
                desc="From posting to pickup to delivery, every step is tracked. Donors see their real impact in real time."
              />
            </div>
          </div>
        </section>

        {/* Active Posts */}
        {activePosts.length > 0 && (
          <section className="pb-16 px-6 bg-muted/30">
            <div className="max-w-5xl mx-auto pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Food Available Now</h2>
                <a href="/ngo" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activePosts.map((post) => (
                  <FoodPostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {activities.length > 0 && (
          <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      a.type === "delivery_done" ? "bg-green-100 text-green-700"
                        : a.type === "pickup_done" ? "bg-purple-100 text-purple-700"
                        : a.type === "post_claimed" ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {a.type === "post_created" ? "Posted" : a.type === "post_claimed" ? "Claimed" : a.type === "pickup_done" ? "Picked Up" : "Delivered"}
                    </span>
                    <p className="text-sm flex-1">{a.description}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 px-6 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to save food?</h2>
            <p className="text-primary-foreground/80">Join thousands of donors, NGOs, and volunteers making a difference every day.</p>
            <a href="/register" className="inline-block">
              <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 mt-2">
                Get Started for Free
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 px-6 text-center text-sm text-muted-foreground">
        Feedora — AI-Powered Real-Time Surplus Food Donation Network
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-4xl font-bold font-mono text-primary">{value}</span>
      <span className="text-sm text-background/60 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
