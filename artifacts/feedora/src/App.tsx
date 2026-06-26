import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import DonorPage from "./pages/donor";
import NGOPage from "./pages/ngo";
import VolunteerPage from "./pages/volunteer";
import ImpactPage from "./pages/impact";
import NotFoundPage from "./pages/not-found";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  const renderPage = () => {
    const path = currentPath.toLowerCase().split("?")[0];

    if (path === "/" || path === "") return <HomePage />;
    if (path === "/login") return <LoginPage />;
    if (path === "/register") return <RegisterPage />;
    if (path === "/donor") return <DonorPage />;
    if (path === "/ngo") return <NGOPage />;
    if (path === "/volunteer") return <VolunteerPage />;
    if (path === "/impact") return <ImpactPage />;

    return <NotFoundPage />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen bg-background">{renderPage()}</div>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
