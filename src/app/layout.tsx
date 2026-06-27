import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/experience/SiteChrome";
import { site } from "@/data/site";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alexandersmith.dev"),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description:
    "Alexander Smith — independent creative web designer & developer building immersive, real-time 3D experiences in the browser.",
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description:
      "Immersive, real-time 3D experiences — interactive brand worlds, product launches and installations rendered live in the browser.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body suppressHydrationWarning className="cursor-none">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
