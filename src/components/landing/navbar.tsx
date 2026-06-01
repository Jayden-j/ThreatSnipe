import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 font-body">
      <span className="text-xl font-semibold tracking-tight text-foreground">
        ✦ ThreatSnipe
      </span>
      <div className="hidden md:flex items-center gap-8">
        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Home
        </Link>
        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </Link>
        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          About
        </Link>
        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Contact
        </Link>
      </div>
      <Button className="rounded-full px-5 text-sm font-medium font-body">
        Get Started
      </Button>
    </nav>
  );
}