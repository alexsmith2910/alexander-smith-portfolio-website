"use client";

import type { ReactNode } from "react";
import { ExperienceProvider } from "./ExperienceProvider";
import WebGLCanvas from "./WebGLCanvas";
import Grain from "./Grain";
import Cursor from "./Cursor";
import Nav from "./Nav";
import MenuOverlay from "./MenuOverlay";
import AudioToggle from "./AudioToggle";
import Loader from "./Loader";
import EasterEgg from "./EasterEgg";

/** Global chrome shared across every route: WebGL background, grain, custom
 *  cursor, nav, fullscreen menu and the ambient-audio toggle. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <ExperienceProvider>
      <WebGLCanvas />
      <Grain />
      {/* cinematic vignette — subtle edge darkening for depth */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          background: "radial-gradient(125% 125% at 50% 42%, transparent 58%, rgba(6,6,6,0.22) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      <Nav />
      <MenuOverlay />
      {children}
      <AudioToggle />
      <Cursor />
      <Loader />
      <EasterEgg />
    </ExperienceProvider>
  );
}
