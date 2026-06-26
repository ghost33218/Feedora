import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFoodPosts,
  useCreateFoodPost,
  useCancelFoodPost,
  getListFoodPostsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Nav } from "@/components/nav";
import { FoodPostCard } from "@/components/food-post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package } from "lucide-react";

const postSchema = z.object({
  foodType: z.enum(["cooked_meal", "raw_produce", "packaged_food", "bakery", "dairy", "beverages", "other"]),
  quantity: z.coerce.number().positive(),
  unit: z.enum(["kg", "portions", "boxes", "liters", "items"]),
  expiryMinutes: z.coerce.number().int().positive(),
  address: z.string().min(1),
  servings: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
});

export default function DonorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useListFoodPosts(undefined, {
    query: { queryKey: getListFoodPostsQueryKey() },
  });

  const createPost = useCreateFoodPost();
  const cancelPost = useCancelFoodPost();

  const myPosts = data?.posts?.filter((p) => p.donorId === user?.id) ?? [];
  const activePosts = myPosts.filter((p) => p.status === "pending" || p.status === "claimed" || p.status === "in_transit");
  const pastPosts = myPosts.filter((p) => p.status === "delivered" || p.status === "cancelled" || p.status === "expired");

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      foodType: "cooked_meal",
      quantity: 1,
      unit: "kg",
      expiryMinutes: 120,
      address: user?.address ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof postSchema>) => {
    createPost.mutate({ data: { ...values, notes: values.notes || undefined, servings: values.servings || undefined } }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListFoodPostsQueryKey() });
        toast({ title: "Post created!", description: "NGOs nearby have been notified." });
      },
      onError: () => {
        toast({ title: "Failed to create post", variant: "destructive" });
      }
    });
  };

  const handleCancel = (id: number) => {
    cancelPost.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFoodPostsQueryKey() });
        toast({ title: "Post cancelled" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Donor Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your surplus food posts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Post Surplus Food
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Post Surplus Food</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="foodType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Food Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="cooked_meal">Cooked Meal</SelectItem>
                            <SelectItem value="raw_produce">Raw Produce</SelectItem>
                            <SelectItem value="packaged_food">Packaged Food</SelectItem>
                            <SelectItem value="bakery">Bakery</SelectItem>
                            <SelectItem value="dairy">Dairy</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="unit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="portions">Portions</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="items">Items</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" min="0.1" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="servings" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Servings</FormLabel>
                        <FormControl><Input type="number" min="1" placeholder="Optional" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="expiryMinutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safe Window (minutes)</FormLabel>
                      <FormControl><Input type="number" min="15" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <FormControl><Input placeholder="123 Main St, City" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl><Textarea placeholder="Dietary info, storage instructions..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createPost.isPending}>
                    {createPost.isPending ? "Posting..." : "Post Food"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-primary">{activePosts.length}</div>
            <div className="text-sm text-muted-foreground">Active Posts</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold">{myPosts.filter(p => p.status === "delivered").length}</div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{myPosts.reduce((a, p) => a + (p.servings ?? 0), 0)}</div>
            <div className="text-sm text-muted-foreground">Total Servings</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-base font-semibold mb-4">Active Posts</h2>
              {activePosts.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No active posts. Click "Post Surplus Food" to get started.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {activePosts.map((post) => (
                    <FoodPostCard
                      key={post.id}
                      post={post}
                      actions={
                        post.status === "pending" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => handleCancel(post.id)}
                          >
                            Cancel
                          </Button>
                        ) : null
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold mb-4">Past Posts</h2>
              {pastPosts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No past posts yet.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pastPosts.map((post) => (
                    <FoodPostCard key={post.id} post={post} />
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
