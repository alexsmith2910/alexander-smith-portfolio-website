/**
 * The dark-plasma shader: one fragment program, two reveal modes —
 * vertical bottom-up sweep (footer dark-zone) and radial-from-corner (menu takeover).
 * Rendered into a half-res target then upscaled (the fbm is the expensive part).
 */
export const PLASMA_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const PLASMA_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uReveal, uMode, uAspect, uMaxField;
uniform vec2 uOrigin;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm3(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
float fbm2(vec2 p){ float v=0.0,a=0.6; for(int i=0;i<2;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
void main(){
  vec2 uv = vUv;
  vec2 q = vec2(fbm3(uv*3.0 + uTime*0.05), fbm3(uv*3.0 - uTime*0.04));
  float n = fbm3(uv*3.0 + q*1.6 + uTime*0.03);
  vec3 dark = vec3(0.012,0.012,0.020);
  vec3 glow = vec3(0.10,0.085,0.17);
  vec3 col = mix(dark, glow, smoothstep(0.15,0.95,n));
  col += glow*0.55*pow(n,3.0);
  float field;
  if(uMode < 0.5){ field = uv.y; }
  else { vec2 d = uv - uOrigin; d.x *= uAspect; field = length(d)/uMaxField; }
  float warp = (fbm2(uv*5.0 + uTime*0.05) - 0.5) * 0.32;
  float front = mix(-0.30, 1.30, uReveal);
  float a = smoothstep(front+0.12, front-0.12, field+warp);
  float rim = smoothstep(0.12, 0.0, abs(field+warp-front));
  col += glow*rim*1.3*uReveal;
  gl_FragColor = vec4(col, a);
}
`;

/**
 * Menu / page-transition plasma — a gated, self-masking takeover for the
 * fullscreen overlay. Cold-violet domain-warped fbm for colour, PLUS an organic
 * dissolve mask (fbm-warped front, like the footer) that creeps from the
 * top-right corner as `uReveal` 0→1 — so there is no hard clip-path edge. A
 * luminous violet rim rides the creeping front; the centre is calmed so the
 * serif nav stays legible. Cursor-reactive. Outputs premultiplied alpha.
 */
export const MENU_PLASMA_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uReveal, uAspect;
uniform vec2 uPointer;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(1.7,9.2); a*=0.5; } return v; }
void main(){
  vec2 uv = vUv;
  // ---- cold-violet domain-warped plasma colour ----
  vec2 q = vec2(fbm(uv*2.2 + uTime*0.05), fbm(uv*2.2 + vec2(3.1,1.7) - uTime*0.045));
  float n = fbm(uv*2.4 + q*1.8 + uTime*0.025);
  vec3 dark = vec3(0.05, 0.05, 0.075);      // lifted floor so lows aren't near-black
  vec3 violet = vec3(0.42, 0.34, 0.85);     // brighter cold violet
  vec3 col = mix(dark, violet, smoothstep(0.22, 0.90, n));
  col += violet*0.50*pow(max(n,0.0),3.0);
  float tr = smoothstep(1.05, 0.0, distance(uv, vec2(0.86,0.96)));
  float bl = smoothstep(1.15, 0.0, distance(uv, vec2(0.06,0.02)));
  col += violet*0.18*tr + violet*0.10*bl;
  vec2 pd = uv - uPointer; pd.x *= uAspect;
  float cur = smoothstep(0.30, 0.0, length(pd));
  col += violet*0.45*cur*cur;
  float vig = smoothstep(0.30, 1.30, distance(uv, vec2(0.5)));
  col *= mix(0.85, 1.0, vig);               // gentler centre dim

  // ---- organic dissolve mask, creeping from the top-right corner ----
  vec2 dd = (uv - vec2(1.0)) * vec2(uAspect, 1.0);
  float field = length(dd) / length(vec2(uAspect, 1.0));   // 0 at top-right → 1 far
  float warp = (fbm(uv*4.0 + uTime*0.05) - 0.5) * 0.36;     // organic, drifting edge
  float front = mix(-0.35, 1.35, uReveal);
  float a = smoothstep(front + 0.15, front - 0.15, field + warp);
  // luminous violet rim riding the creeping front
  float rim = smoothstep(0.18, 0.0, abs(field + warp - front));
  col += violet * 0.8 * rim;

  // screen-blended film grain — lifts the darks a touch, like the old overlay
  float gr = hash(gl_FragCoord.xy + uTime*40.0);
  col = 1.0 - (1.0 - col) * (1.0 - gr * 0.06);

  gl_FragColor = vec4(col * a, a);   // premultiplied alpha
}
`;

/**
 * Cinematic composite for the clay scene. The clay is rendered to a target, then
 * drawn to screen through this — adding edge-weighted chromatic aberration and a
 * high-threshold halation (only the brightest specular peaks bloom, so the near-
 * white bone palette never blows out). Alpha is preserved from the source so the
 * transparent background stays transparent (composites over the page). Whisper-subtle.
 */
export const POST_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;     // 1.0 / drawingBufferSize
uniform float uCA;       // chromatic aberration amount (≈ px at the corners)
uniform float uGlow;     // halation strength
uniform float uThresh;   // luminance threshold — only peaks above this bloom
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
void main(){
  vec2 uv = vUv;
  vec2 cc = uv - 0.5;
  float edge = dot(cc, cc);                 // 0 at centre → ~0.5 at corners
  vec2 off = cc * edge * uCA * uTexel;       // radial, stronger toward the edges
  // chromatic aberration: split R/B radially, keep G centred
  float r = texture2D(uTex, uv + off).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - off).b;
  vec4 base = texture2D(uTex, uv);
  vec3 col = vec3(r, g, b);
  // luminance-gated halation — 8-tap ring, only the brightest specular contributes
  vec3 gsum = vec3(0.0);
  for(int i=0;i<8;i++){
    float ang = float(i) * 0.7853981634;     // 45° steps
    vec2 d = vec2(cos(ang), sin(ang)) * uTexel * 3.5;
    vec4 s = texture2D(uTex, uv + d);
    gsum += s.rgb * max(luma(s.rgb) - uThresh, 0.0) * s.a;
  }
  col += gsum * uGlow;
  gl_FragColor = vec4(col, base.a);
}
`;

/** floating-preview dissolve shader (Work index hover preview) */
export const DISSOLVE_VERT = /* glsl */ `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

export const DISSOLVE_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uProg;
uniform float uAngA, uWA; uniform vec3 uC1A, uC2A;
uniform float uAngB, uWB; uniform vec3 uC1B, uC2B;
float stripe(vec2 f, float a, float w){ vec2 d = vec2(cos(a), sin(a)); return step(0.5, fract(dot(f,d)/(2.0*w))); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec2 f = gl_FragCoord.xy;
  vec3 a = mix(uC1A, uC2A, stripe(f, uAngA, uWA));
  vec3 b = mix(uC1B, uC2B, stripe(f, uAngB, uWB));
  float n = hash(floor(f/3.0));
  float m = smoothstep(uProg-0.13, uProg+0.13, n);
  gl_FragColor = vec4(mix(b, a, m), 1.0);
}
`;
