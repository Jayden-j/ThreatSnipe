import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero";

export default function HomePage() {
  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden">
      <LandingNavbar />
      <HeroSection />
    </main>
  );
}