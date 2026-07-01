import type { Metadata } from "next";

const description =
  "Start a project with Alexander Smith — independent designer & developer. Brand worlds, launches and installations. I reply to every serious enquiry within two working days.";

export const metadata: Metadata = {
  title: "Contact",
  description,
  openGraph: { title: "Contact — Alexander Smith", description },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
