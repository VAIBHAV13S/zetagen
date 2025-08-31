import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Landing from "./pages/Landing";
import Generator from "./pages/Generator";
import Gallery from "./pages/Gallery";
import GatewayDemo from "./pages/GatewayDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { initializeWallet } = useStore();

  useEffect(() => {
    // Initialize wallet connection on app load
    initializeWallet();
  }, [initializeWallet]);

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/demo" element={<GatewayDemo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
