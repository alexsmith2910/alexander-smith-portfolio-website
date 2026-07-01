import type { Metadata } from "next";

const description =
  "The Lab — interactive experiments, shaders and sketches built from scratch. Everything here is made for fun; imagine what I'll build for you.";

export const metadata: Metadata = {
  title: "The Lab",
  description,
  openGraph: { title: "The Lab — Alexander Smith", description },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
