import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Leaf } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["donor", "ngo", "volunteer"]),
  organizationName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const roles = [
  { value: "donor", label: "Donor", desc: "Restaurant, hotel, or business with surplus food" },
  { value: "ngo", label: "NGO / Shelter", desc: "Organization receiving food for those in need" },
  { value: "volunteer", label: "Volunteer", desc: "Help pick up and deliver food to NGOs" },
] as const;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerUser = useRegisterUser();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "donor", organizationName: "", address: "", phone: "" },
  });

  const selectedRole = form.watch("role");

  const onSubmit = (data: z.infer<typeof schema>) => {
    registerUser.mutate({ data: { ...data, phone: data.phone || undefined, organizationName: data.organizationName || undefined, address: data.address || undefined } }, {
      onSuccess: (res) => {
        login(res.user, res.token);
        if (res.user.role === "donor") setLocation("/donor");
        else if (res.user.role === "ngo") setLocation("/ngo");
        else setLocation("/volunteer");
      },
      onError: () => {
        toast({ title: "Registration failed", description: "Email may already be in use.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <Leaf className="w-12 h-12 text-primary mb-2" />
          <h1 className="text-2xl font-bold">Join the Network</h1>
          <p className="text-muted-foreground text-sm">Help save food, feed communities</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I am a...</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => field.onChange(r.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${field.value === r.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                      >
                        <div className="text-sm font-semibold">{r.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{selectedRole === "ngo" ? "Contact Name" : "Full Name"}</FormLabel>
                  <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {(selectedRole === "ngo" || selectedRole === "donor") && (
              <FormField control={form.control} name="organizationName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{selectedRole === "ngo" ? "Organization Name" : "Business Name"}</FormLabel>
                  <FormControl><Input placeholder={selectedRole === "ngo" ? "Hope Foundation" : "The Grand Hotel"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Address (optional)</FormLabel>
                <FormControl><Input placeholder="123 Main St, City" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" placeholder="At least 6 characters" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={registerUser.isPending}>
              {registerUser.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
