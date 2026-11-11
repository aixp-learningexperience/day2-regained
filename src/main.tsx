import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./styles.css";
import { CampusProvider } from "@/lib/campus";
import { MobileCta, TopBar } from "@/components/landing/Basics";
import { Hero } from "@/components/landing/Hero";
import { Campus, Footer, HowItWorks, Why } from "@/components/landing/Info";
import { Register } from "@/components/landing/Register";
import { Slots } from "@/components/landing/Slots";
import { Match } from "@/components/landing/Match";
import { TopPitches } from "@/components/landing/Pitch";
import { Thanks } from "@/components/landing/Thanks";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CampusProvider>
        <TopBar />
        <main>
          <Hero />
          <HowItWorks />
          <Campus />
          <Register />
          <Slots />
          <TopPitches />
          <Match />
          <Why />
          <Thanks />
        </main>
        <Footer />
        <MobileCta />
      </CampusProvider>
      <Toaster position="top-center" theme="dark" />
    </QueryClientProvider>
  </StrictMode>,
);
