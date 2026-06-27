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

/** Global chrome shared across every route: WebGL background, grain, custom
 *  cursor, nav, fullscreen menu and the ambient-audio toggle. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <ExperienceProvider>
      <WebGLCanvas />
      <Grain />
      <Nav />
      <MenuOverlay />
      {children}
      <AudioToggle />
      <Cursor />
      <Loader />
    </ExperienceProvider>
  );
}
