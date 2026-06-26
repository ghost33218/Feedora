# Feedora - Food Donation & Distribution Platform

A modern web application connecting food donors, NGOs, and volunteers to reduce food waste and fight hunger in real-time.

## Overview

Feedora is a platform that enables:
- **Donors** to post available food items (cooked meals, bakery items, produce, dairy)
- **NGOs** to claim and receive food donations for distribution
- **Volunteers** to facilitate pickup and delivery
- Real-time impact tracking of meals saved, CO2 prevented, and lives helped

## Features

### Core Functionality
- User authentication with role-based access (Donor, NGO, Volunteer)
- Food post creation with location tracking and expiry windows
- Real-time claim and delivery management system
- Activity feed showing all platform actions
- Impact dashboard with aggregate metrics

### User Dashboards
- **Donor Dashboard**: Post food items, track donations, view impact
- **NGO Dashboard**: Claim available food, manage pickups, schedule deliveries
- **Volunteer Dashboard**: View available tasks, track deliveries, earn ratings
- **Impact Dashboard**: View platform-wide metrics, food type breakdown, top contributors

### Data & Analytics
- Total meals saved and CO2 emissions prevented
- Number of active donations and partnerships
- Volunteer performance tracking
- Food waste breakdown by category
- Real-time activity logging

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: React Query for data fetching and caching
- **Routing**: Custom path-based routing (window.location.pathname)
- **Theme**: next-themes for light/dark mode support
- **Notifications**: Sonner for toast messages
- **Forms**: React Hook Form with Zod validation
- **Backend**: Vercel API routes with mock in-memory database
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ or higher
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Tanmay2006-Tech/Feedora.git
cd Feedora
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm run build
```

4. Start development server:
```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
feedora/
├── artifacts/
│   ├── feedora/              # Main React application
│   │   ├── src/
│   │   │   ├── pages/        # Page components (home, login, register, etc.)
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── utils/        # Utility functions
│   │   │   └── index.css     # Global styles
│   │   ├── vite.config.ts    # Vite configuration
│   │   └── package.json
│   ├── api-server/           # Express API server
│   └── mockup-sandbox/       # Component preview
├── api/                       # Vercel API routes
│   └── [[...slug]].ts        # Mock API handler
├── lib/                       # Shared libraries
│   ├── api-client-react/     # API client hooks
│   ├── api-zod/              # Zod schemas for validation
│   └── db/                   # Database utilities
├── vercel.json               # Vercel deployment config
├── pnpm-workspace.yaml       # pnpm workspace config
└── package.json              # Root package dependencies
```

## Pages

### Public Pages
- **Home** (`/`) - Landing page with platform overview and CTA
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New user signup with role selection

### Authenticated Pages
- **Donor** (`/donor`) - Donor dashboard for posting food
- **NGO** (`/ngo`) - NGO dashboard for claiming donations
- **Volunteer** (`/volunteer`) - Volunteer dashboard for deliveries
- **Impact** (`/impact`) - Real-time impact metrics and analytics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Food Posts
- `GET /api/food-posts` - List all food posts
- `POST /api/food-posts` - Create new food post
- `GET /api/food-posts/{id}` - Get specific post details
- `POST /api/food-posts/{id}/claim` - Claim a food post
- `POST /api/food-posts/{id}/cancel` - Cancel a post

### Claims & Delivery
- `GET /api/claims` - List all claims
- `POST /api/claims` - Create claim for food post
- `POST /api/claims/{id}/pickup` - Mark food as picked up
- `POST /api/claims/{id}/deliver` - Mark food as delivered

### Impact & Analytics
- `GET /api/impact/summary` - Platform-wide impact metrics
- `GET /api/impact/by-food-type` - Impact breakdown by food category
- `GET /api/activity/recent` - Recent platform activity

### Directory
- `GET /api/ngos` - List all partner NGOs
- `GET /api/volunteers` - List all active volunteers

## Database

The application uses an in-memory mock database that resets on each deployment. This is ideal for hackathons and demonstrations. For production use, integrate with:
- PostgreSQL (via Neon or similar)
- MongoDB
- Firebase Realtime Database

## Deployment

### Deploy to Vercel

1. Push code to GitHub:
```bash
git push origin main
```

2. Connect repository to Vercel:
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Deploy"

3. Vercel automatically:
   - Installs dependencies
   - Builds the project
   - Deploys the application
   - Sets up SSL certificates

**Live Demo**: https://feedora-git-project-deployment-readiness-byteeesss.vercel.app

## Test Accounts

The following test accounts are available:

```
Donor:
Email: john@donor.com
Password: password

NGO:
Email: contact@foodforall.org
Password: password

Volunteer:
Email: sarah@volunteer.com
Password: password
```

## Features Implemented

- User authentication with role-based access control
- Food donation posting with location and expiry tracking
- Real-time food claim management
- Volunteer assignment and delivery tracking
- Activity feed with all platform events
- Impact dashboard with metrics and analytics
- Dark mode / Light mode toggle
- Responsive mobile design
- Form validation with error messages
- Toast notifications for user feedback
- Accessible UI with semantic HTML

## Performance

- Frontend bundle: 275.55 KB (91.41 KB gzipped)
- React Query caching with 5-minute stale time
- Optimized component loading
- Lazy rendering with React.lazy
- Build time: <30 seconds on Vercel

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

This is a hackathon project. For improvements or bug reports, please open an issue on GitHub.

## License

MIT License - feel free to use this project for your own hackathon submissions or learning.

## Author

Built for [Your Hackathon Name] - [Year]

## Contact

For questions or collaboration opportunities, please reach out through GitHub.

---

**Status**: Production Ready | **Last Updated**: 2024 | **Version**: 1.0.0
