import type { Metadata } from "next";

const description =
  "Independent designer & developer in Dubai — I design and build immersive, high-craft websites end-to-end, from real-time 3D and motion to full-stack delivery.";

export const metadata: Metadata = {
  title: "About",
  description,
  openGraph: { title: "About — Alexander Smith", description },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
