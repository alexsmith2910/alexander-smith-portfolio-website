import type { Metadata } from "next";

const description =
  "Selected work — immersive brand worlds, product launches and real-time 3D experiences, rendered live in the browser.";

export const metadata: Metadata = {
  title: "Work",
  description,
  openGraph: { title: "Work — Alexander Smith", description },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
