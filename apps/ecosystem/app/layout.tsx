import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "PRISM Domain Expansion — Research Ecosystem",
  description:
    "DO, Pharmacy, Dentistry, Medicine — competitors, accreditation, personas, journeys, and the where-to-play scorecard for Exxat PRISM's expansion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppNav>{children}</AppNav>
        </Providers>
      </body>
    </html>
  );
}
