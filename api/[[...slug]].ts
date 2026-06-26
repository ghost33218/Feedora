import type { VercelRequest, VercelResponse } from "@vercel/node";

// Add CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
}

// Mock database
const mockUsers = new Map([
  ["user1", { id: "user1", name: "John Donor", email: "john@donor.com", role: "donor", createdAt: new Date("2024-01-15") }],
  ["ngo1", { id: "ngo1", name: "Food for All NGO", email: "contact@foodforall.org", role: "ngo", createdAt: new Date("2024-01-10") }],
  ["vol1", { id: "vol1", name: "Sarah Volunteer", email: "sarah@volunteer.com", role: "volunteer", createdAt: new Date("2024-02-01") }],
]);

const mockFoodPosts: Record<string, any> = {
  "post1": {
    id: "post1",
    donorId: "user1",
    title: "Fresh Bakery Items",
    description: "30 loaves of whole wheat bread",
    foodType: "bread",
    quantity: 30,
    expiryWindow: "2 hours",
    status: "pending",
    location: { lat: 28.6139, lng: 77.2090, address: "Delhi, India" },
    createdAt: new Date().toISOString(),
    images: ["https://images.unsplash.com/photo-1585080195519-c21b5b1ff59b?w=400"],
  },
  "post2": {
    id: "post2",
    donorId: "user1",
    title: "Cooked Meals",
    description: "50 servings of vegetable biryani",
    foodType: "cooked",
    quantity: 50,
    expiryWindow: "1 hour",
    status: "pending",
    location: { lat: 28.6139, lng: 77.2090, address: "Delhi, India" },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"],
  },
  "post3": {
    id: "post3",
    donorId: "user1",
    title: "Dairy Products",
    description: "20 liters of fresh milk",
    foodType: "dairy",
    quantity: 20,
    expiryWindow: "6 hours",
    status: "claimed",
    claimedBy: "ngo1",
    location: { lat: 28.6139, lng: 77.2090, address: "Delhi, India" },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    images: ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400"],
  },
};

const mockActivities = [
  { id: "1", type: "post_created", description: "New post: Fresh Bakery Items from Local Bakery", createdAt: new Date().toISOString() },
  { id: "2", type: "post_claimed", description: "Food for All NGO claimed Fresh Bakery Items", createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "3", type: "pickup_done", description: "Sarah Volunteer picked up meals from restaurant", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "4", type: "delivery_done", description: "Meals delivered to community center", createdAt: new Date(Date.now() - 5400000).toISOString() },
  { id: "5", type: "post_created", description: "New post: Fresh vegetables from farm", createdAt: new Date(Date.now() - 7200000).toISOString() },
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug : [];
  const path = `/${slug.join("/")}`;

  try {
    // Health check
    if (path === "/api/healthz") {
      return res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // Auth endpoints
    if (path === "/api/auth/register" && req.method === "POST") {
      const { email, password, name, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const userId = `user_${Date.now()}`;
      mockUsers.set(userId, { id: userId, name, email, role: role || "donor", createdAt: new Date() });
      return res.status(200).json({ user: mockUsers.get(userId), token: `token_${userId}` });
    }

    if (path === "/api/auth/login" && req.method === "POST") {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const user = Array.from(mockUsers.values()).find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.status(200).json({ user, token: `token_${user.id}` });
    }

    // Impact summary
    if (path === "/api/impact/summary" && req.method === "GET") {
      return res.status(200).json({
        totalMealsSaved: 15234,
        totalDonations: 342,
        totalDelivered: 13420,
        co2AvoidedKg: 4523.5,
        totalNgos: 42,
        activePosts: 23,
        totalVolunteers: 156,
        averageDeliveryTime: "18 mins",
      });
    }

    // Recent activity
    if (path === "/api/activity/recent" && req.method === "GET") {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      return res.status(200).json({
        activities: mockActivities.slice(0, limit),
        total: mockActivities.length,
      });
    }

    // Food posts
    if (path === "/api/posts" && req.method === "GET") {
      const status = req.query.status as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      let posts = Object.values(mockFoodPosts);
      
      if (status) {
        posts = posts.filter(p => p.status === status);
      }
      
      return res.status(200).json({
        posts: posts.slice(0, limit),
        total: posts.length,
      });
    }

    if (path === "/api/posts" && req.method === "POST") {
      const { title, description, foodType, quantity, expiryWindow, location } = req.body;
      const postId = `post_${Date.now()}`;
      const newPost = {
        id: postId,
        donorId: "user1",
        title,
        description,
        foodType,
        quantity,
        expiryWindow,
        status: "pending",
        location,
        createdAt: new Date().toISOString(),
        images: [],
      };
      mockFoodPosts[postId] = newPost;
      return res.status(201).json(newPost);
    }

    if (path.startsWith("/api/posts/") && req.method === "GET") {
      const postId = path.split("/")[3];
      const post = mockFoodPosts[postId];
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json(post);
    }

    // NGOs
    if (path === "/api/ngos" && req.method === "GET") {
      const ngos = [
        { id: "ngo1", organizationName: "Food for All NGO", totalClaimsCompleted: 142, reliabilityScore: 98.5 },
        { id: "ngo2", organizationName: "Community Kitchen", totalClaimsCompleted: 89, reliabilityScore: 96.2 },
        { id: "ngo3", organizationName: "Hunger Relief Initiative", totalClaimsCompleted: 67, reliabilityScore: 94.8 },
      ];
      return res.status(200).json({
        ngos,
        total: 42,
      });
    }

    // Donors
    if (path === "/api/donors" && req.method === "GET") {
      return res.status(200).json({
        donors: Array.from(mockUsers.values()).filter(u => u.role === "donor"),
        total: 156,
      });
    }

    // Volunteers
    if (path === "/api/volunteers" && req.method === "GET") {
      const volunteers = [
        { id: "vol1", name: "Sarah Volunteer", totalDeliveries: 45, rating: 4.9 },
        { id: "vol2", name: "Mike Johnson", totalDeliveries: 38, rating: 4.8 },
        { id: "vol3", name: "Emma Davis", totalDeliveries: 32, rating: 4.95 },
      ];
      return res.status(200).json({
        volunteers,
        total: 156,
      });
    }

    // Get current user
    if (path === "/api/auth/me" && req.method === "GET") {
      return res.status(200).json(mockUsers.get("user1"));
    }

    // Claims list
    if (path === "/api/claims" && req.method === "GET") {
      return res.status(200).json({
        claims: [
          { id: "claim1", postId: "post3", ngoId: "ngo1", status: "delivered", createdAt: new Date().toISOString() },
        ],
        total: 1,
      });
    }

    // Create claim
    if (path === "/api/claims" && req.method === "POST") {
      const { postId, ngoId } = req.body;
      if (mockFoodPosts[postId]) {
        mockFoodPosts[postId].status = "claimed";
        mockFoodPosts[postId].claimedBy = ngoId;
        return res.status(201).json({ id: `claim_${Date.now()}`, postId, ngoId, status: "claimed" });
      }
      return res.status(404).json({ error: "Post not found" });
    }

    // Pickup claim
    if (path.match(/^\/api\/claims\/[\w-]+\/pickup$/) && req.method === "POST") {
      return res.status(200).json({ status: "picked_up", pickedUpAt: new Date().toISOString() });
    }

    // Deliver claim
    if (path.match(/^\/api\/claims\/[\w-]+\/deliver$/) && req.method === "POST") {
      return res.status(200).json({ status: "delivered", deliveredAt: new Date().toISOString() });
    }

    // Cancel post
    if (path.match(/^\/api\/food-posts\/[\w-]+\/cancel$/) && req.method === "POST") {
      const postId = path.split("/")[3];
      if (mockFoodPosts[postId]) {
        mockFoodPosts[postId].status = "cancelled";
        return res.status(200).json(mockFoodPosts[postId]);
      }
      return res.status(404).json({ error: "Post not found" });
    }

    // Claim post
    if (path.match(/^\/api\/food-posts\/[\w-]+\/claim$/) && req.method === "POST") {
      const postId = path.split("/")[3];
      if (mockFoodPosts[postId]) {
        mockFoodPosts[postId].status = "claimed";
        return res.status(200).json(mockFoodPosts[postId]);
      }
      return res.status(404).json({ error: "Post not found" });
    }

    // Impact by food type
    if (path === "/api/impact/by-food-type" && req.method === "GET") {
      return res.status(200).json({
        breakdown: [
          { foodType: "cooked_meal", count: 5230, servings: 15230, co2Avoided: 1500 },
          { foodType: "bakery", count: 3400, servings: 5100, co2Avoided: 980 },
          { foodType: "dairy", count: 2100, servings: 3500, co2Avoided: 650 },
          { foodType: "raw_produce", count: 2504, servings: 4200, co2Avoided: 800 },
          { foodType: "packaged_food", count: 1500, servings: 2500, co2Avoided: 450 },
        ],
      });
    }

    // NGO match for post
    if (path.match(/^\/api\/ngos\/match\/[\w-]+$/) && req.method === "GET") {
      return res.status(200).json({
        matches: [
          { ngoId: "ngo1", name: "Food for All NGO", distance: 2.5, score: 95 },
        ],
      });
    }

    // Get specific NGO
    if (path.match(/^\/api\/ngos\/[\w-]+$/) && req.method === "GET") {
      return res.status(200).json(mockUsers.get("ngo1"));
    }

    // Get specific post
    if (path.match(/^\/api\/food-posts\/[\w-]+$/) && req.method === "GET") {
      const postId = path.split("/")[3];
      if (mockFoodPosts[postId]) {
        return res.status(200).json(mockFoodPosts[postId]);
      }
      return res.status(404).json({ error: "Post not found" });
    }

    // Create food post
    if (path === "/api/food-posts" && req.method === "POST") {
      const { title, description, foodType, quantity, expiryWindow, location, unit, expiryMinutes, address } = req.body;
      const postId = `post_${Date.now()}`;
      const newPost = {
        id: postId,
        donorId: "user1",
        title: title || `Food Post ${postId}`,
        description: description || "",
        foodType,
        quantity,
        unit: unit || "kg",
        expiryMinutes: expiryMinutes || 120,
        expiryWindow: expiryWindow || "2 hours",
        status: "pending",
        location: location || { lat: 28.6139, lng: 77.2090, address: address || "Delhi, India" },
        createdAt: new Date().toISOString(),
        images: [],
      };
      mockFoodPosts[postId] = newPost;
      return res.status(201).json(newPost);
    }

    return res.status(404).json({ error: "Endpoint not found", path });
  } catch (error) {
    console.error("[v0] API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
