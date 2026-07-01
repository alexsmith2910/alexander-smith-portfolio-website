"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/experience/ExperienceProvider";
import Kicker from "@/components/ui/Kicker";
import TextButton from "@/components/ui/TextButton";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/data/site";

const CHIPS = ["Brand world", "Product launch", "Installation", "Configurator", "Something else"] as const;

/** A no-box field: hairline rule + a focus-draw underline that grows left→right
 *  on focus and retracts to the right on blur when left empty. */
function FieldUnderline({ focused, filled }: { focused: boolean; filled: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 bottom-0 h-px w-full bg-ink transition-transform duration-[550ms] ease-[cubic-bezier(.22,1,.36,1)]"
      style={{
        transform: focused || filled ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: focused || filled ? "left" : "right",
      }}
    />
  );
}

/** The house text-button styling as a real submit button: ever-present
 *  underline that redraws left→right on hover, a nudging arrow, magnetic pull. */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const elRef = useRef<HTMLButtonElement | null>(null);
  const ulRef = useRef<HTMLSpanElement | null>(null);
  const arRef = useRef<HTMLSpanElement | null>(null);

  const onEnter = () => {
    const ul = ulRef.current;
    if (ul) {
      ul.style.transformOrigin = "right";
      ul.style.transform = "scaleX(0)";
      window.setTimeout(() => {
        ul.style.transformOrigin = "left";
        ul.style.transform = "scaleX(1)";
      }, 260);
    }
    if (arRef.current) arRef.current.style.transform = "translateX(6px)";
  };
  const onLeave = () => {
    if (arRef.current) arRef.current.style.transform = "translate(0,0)";
    if (elRef.current) {
      elRef.current.style.transform = "translate(0,0)";
      elRef.current.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
    }
  };
  const onMove = (e: React.MouseEvent) => {
    if (!elRef.current) return;
    const b = elRef.current.getBoundingClientRect();
    const x = e.clientX - b.left - b.width / 2;
    const y = e.clientY - b.top - b.height / 2;
    elRef.current.style.transform = `translate(${x * 0.3}px,${y * 0.4}px)`;
    elRef.current.style.transition = "transform .1s";
  };

  return (
    <button
      ref={elRef}
      type="submit"
      data-cursor="enter"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
      className="relative bg-transparent border-none cursor-none text-inherit inline-flex items-center gap-3 text-[13px] tracking-[.2em] uppercase pb-[10px]"
    >
      {children}
      <span
        ref={arRef}
        className="inline-block transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)]"
      >
        →
      </span>
      <span
        ref={ulRef}
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-ink transition-transform duration-[500ms] ease-[cubic-bezier(.22,1,.36,1)]"
        style={{
          transform: "scaleX(1)",
          transformOrigin: "left",
        }}
      />
    </button>
  );
}

export default function ContactPage() {
  const { reduced } = useExperience();

  // ---------- form state ----------
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending || sent) return;
    if (!email.trim()) {
      setStatus("Add an email so I can reply");
      return;
    }
    setSending(true);
    setStatus("Sending…");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, project: chosen, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error || "Something went wrong — email me directly.");
        setSending(false);
        return;
      }
      const firstName = name.trim().split(" ")[0];
      setStatus(`${firstName ? firstName + " — " : ""}sent. I'll be in touch.`);
      setSent(true);
    } catch {
      setStatus("Network error — email me directly.");
    } finally {
      setSending(false);
    }
  };

  // ---------- intro masked reveal ----------
  const kickerRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reveal = () => {
      lineRefs.current.forEach((l) => l && (l.style.transform = "translateY(0)"));
      if (kickerRef.current) kickerRef.current.style.transform = "translateY(0)";
      if (subRef.current) subRef.current.style.transform = "translateY(0)";
    };

    if (reduced) {
      reveal();
      return;
    }

    const tl = gsap.timeline();
    tl.to(kickerRef.current, { y: 0, duration: 1.1, ease: "power4.out", delay: 0.15 })
      .to(lineRefs.current.filter(Boolean), { y: 0, duration: 1.2, stagger: 0.14, ease: "power4.out" }, 0.28)
      .to(subRef.current, { y: 0, duration: 1.1, ease: "power4.out" }, 0.72);

    // safety: never leave the header hidden
    const safety = window.setTimeout(reveal, 2300);
    return () => {
      tl.kill();
      clearTimeout(safety);
    };
  }, [reduced]);

  return (
    <div data-view="contact">
      {/* HEADER */}
      <header
        id="top"
        className="relative z-[1] px-gutter pt-[clamp(120px,18vh,200px)] pb-[clamp(30px,6vh,56px)]"
      >
        <div className="overflow-hidden mb-[clamp(18px,3.5vh,34px)]">
          <div ref={kickerRef} style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <Kicker>Contact — start a project</Kicker>
          </div>
        </div>

        <h1 className="font-serif font-normal text-[clamp(54px,12vw,200px)] leading-[0.92] tracking-[-.03em]">
          {["Let's build", "something felt."].map((line, i) => (
            // pb on the inner (sliding) span holds the descender (g/y/p) inside the clip;
            // translateY% is relative to that span, so the taller box still hides at start.
            <span key={i} className="block overflow-hidden mb-[-.18em]">
              <span
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className={`block pb-[.18em] ${i === 1 ? "italic" : "not-italic"}`}
                style={{
                  transform: reduced ? "none" : "translateY(115%)",
                }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-[clamp(24px,4vh,40px)] overflow-hidden">
          <div ref={subRef} className="max-w-[50ch]" style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <p className="text-[15px] leading-[1.55] opacity-[.7]">
              Tell me what you&apos;re imagining — a brand world, a launch, an installation. I reply to every serious
              enquiry within two working days.
            </p>
          </div>
        </div>
      </header>

      {/* BODY: form + details */}
      <main className="relative z-[1] px-gutter pt-[clamp(40px,8vh,90px)] pb-[clamp(100px,18vh,220px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(40px,7vw,110px)] items-start">
          {/* FORM */}
          <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-[clamp(26px,4vh,40px)]">
              {/* 01 — Your name */}
              <div data-reveal className="relative opacity-0">
                <label
                  htmlFor="cf-name"
                  className={`block font-mono text-[11px] uppercase tracking-[.24em] mb-[14px] transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                    focusField === "name" ? "opacity-90 translate-x-1" : "opacity-50"
                  }`}
                >
                  01 — Your name <span className="opacity-60">(optional)</span>
                </label>
                <input
                  id="cf-name"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusField("name")}
                  onBlur={() => setFocusField(null)}
                  data-cursor=""
                  placeholder="Jane Mercer"
                  className="w-full bg-transparent border-none outline-none font-serif text-[clamp(24px,3vw,38px)] pb-3 cursor-none"
                />
                <span className="absolute inset-x-0 bottom-0 h-px bg-ink opacity-[.18]" />
                <FieldUnderline focused={focusField === "name"} filled={!!name} />
              </div>

              {/* 02 — Email */}
              <div data-reveal className="relative opacity-0">
                <label
                  htmlFor="cf-email"
                  className={`block font-mono text-[11px] uppercase tracking-[.24em] mb-[14px] transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                    focusField === "email" ? "opacity-90 translate-x-1" : "opacity-50"
                  }`}
                >
                  02 — Email
                </label>
                <input
                  id="cf-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  data-cursor=""
                  placeholder="jane@studio.com"
                  className="w-full bg-transparent border-none outline-none font-serif text-[clamp(24px,3vw,38px)] pb-3 cursor-none"
                />
                <span className="absolute inset-x-0 bottom-0 h-px bg-ink opacity-[.18]" />
                <FieldUnderline focused={focusField === "email"} filled={!!email} />
              </div>

              {/* 03 — What's the project (chips) */}
              <div data-reveal className="relative opacity-0">
                <label
                  className={`block font-mono text-[11px] uppercase tracking-[.24em] mb-4 transition-opacity duration-[400ms] ${
                    chosen ? "opacity-90" : "opacity-50"
                  }`}
                >
                  03 — What&apos;s the project
                </label>
                <div className="flex flex-wrap gap-[10px]">
                  {CHIPS.map((c) => {
                    const on = chosen === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        data-cursor=""
                        onClick={() => setChosen(on ? null : c)}
                        className={`border cursor-none font-mono text-[11px] tracking-[.12em] uppercase px-4 py-[11px] rounded-full transition-all duration-[350ms] ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 ${
                          on ? "bg-ink text-bone border-ink scale-[1.03]" : "border-ink/22 hover:border-ink/55"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 04 — Tell me more */}
              <div data-reveal className="relative opacity-0">
                <label
                  htmlFor="cf-message"
                  className={`block font-mono text-[11px] uppercase tracking-[.24em] mb-[14px] transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                    focusField === "message" ? "opacity-90 translate-x-1" : "opacity-50"
                  }`}
                >
                  04 — Tell me more
                </label>
                <textarea
                  id="cf-message"
                  name="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setFocusField("message")}
                  onBlur={() => setFocusField(null)}
                  data-cursor=""
                  placeholder="A sentence or two on the ambition, audience and timeline…"
                  className="w-full bg-transparent border-none outline-none resize-none font-grotesk text-[clamp(16px,1.6vw,20px)] leading-[1.5] pb-3 cursor-none"
                />
                <span className="absolute inset-x-0 bottom-0 h-px bg-ink opacity-[.18]" />
                <FieldUnderline focused={focusField === "message"} filled={!!message} />
              </div>

              {/* SUBMIT */}
              <div data-reveal className="flex items-center gap-6 flex-wrap mt-[6px] opacity-0">
                <SubmitButton>{sent ? "Sent ✓" : sending ? "Sending…" : "Send enquiry"}</SubmitButton>
                <span
                  aria-live="polite"
                  className={`font-mono text-[11px] tracking-[.14em] uppercase transition-opacity duration-[400ms] ${
                    status ? "opacity-[.7]" : "opacity-0"
                  }`}
                >
                  {status}
                </span>
              </div>
            </form>
          </div>

          {/* DETAILS */}
          <Reveal as="div" className="flex flex-col gap-[clamp(36px,5vh,56px)]">
            {/* Direct */}
            <div>
              <div className="block font-mono text-[11px] uppercase tracking-[.3em] opacity-[.5] mb-[18px]">Direct</div>
              <TextButton
                href={`mailto:${site.email}`}
                cursor="email"
                magnetic
                arrow={null}
                className="font-serif text-[clamp(26px,3vw,40px)]"
              >
                {site.email}
              </TextButton>
              <div className="mt-[14px] text-[14px] leading-[1.55] opacity-[.6] max-w-[34ch]">
                For new work, press and speaking. I read everything myself.
              </div>
              {(site.booking.href || site.cv.href) && (
                <div className="mt-[22px] flex flex-wrap items-center gap-x-7 gap-y-3">
                  {site.booking.href && (
                    <TextButton href={site.booking.href} cursor="enter" magnetic arrow="↗">
                      {site.booking.label}
                    </TextButton>
                  )}
                  {site.cv.href && (
                    <TextButton href={site.cv.href} cursor="read" magnetic arrow="↗">
                      {site.cv.label}
                    </TextButton>
                  )}
                </div>
              )}
            </div>

            {/* Elsewhere */}
            <div>
              <div className="block font-mono text-[11px] uppercase tracking-[.3em] opacity-[.5] mb-[18px]">Elsewhere</div>
              <ul className="list-none flex flex-col">
                {site.socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      data-cursor="link"
                      className="group flex justify-between gap-5 no-underline text-inherit border-b border-ink/12 py-[15px] text-[15px] transition-colors duration-300 hover:border-ink/40"
                    >
                      <span className="inline-flex items-center gap-2 transition-transform duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1.5">
                        <span aria-hidden className="h-px w-0 bg-ink/50 transition-[width] duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:w-4" />
                        {s.name}
                      </span>
                      <span className="font-mono text-xs opacity-[.45] transition-opacity duration-300 group-hover:opacity-80">
                        {s.handle}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Based in + Availability */}
            <div className="flex gap-[clamp(30px,4vw,60px)] flex-wrap">
              <div>
                <div className="block font-mono text-[11px] uppercase tracking-[.3em] opacity-[.5] mb-[14px]">Based in</div>
                <div className="text-[15px] leading-[1.6] opacity-[.72]">
                  {site.location.city}, {site.location.country}
                  <br />
                  <span className="font-mono text-xs opacity-[.6]">
                    {site.location.coords}
                  </span>
                </div>
              </div>
              <div>
                <div className="block font-mono text-[11px] uppercase tracking-[.3em] opacity-[.5] mb-[14px]">Availability</div>
                <div className="flex items-center gap-[10px] text-[15px] opacity-[.72]">
                  {site.availability.open && (
                    <span className="relative inline-flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-ink opacity-60 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
                    </span>
                  )}
                  {site.availability.short}
                </div>
                <div className="mt-[10px] text-[14px] leading-[1.55] opacity-[.55] max-w-[24ch]">
                  {site.availability.note}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      {/* FOOTER — dark-zone contact footer (tall, so the dissolve fully plays out) */}
      <footer
        id="contact"
        data-darkzone=""
        className="relative z-[1] text-ink min-h-[100dvh] flex flex-col justify-end px-gutter pt-[clamp(90px,18vh,200px)] pb-10"
      >
        <Reveal className="border-t border-bone/18 pt-[clamp(40px,7vh,80px)] flex justify-between items-end flex-wrap gap-[30px]">
          <div className="font-serif text-[clamp(34px,5vw,80px)] italic leading-[1.02] tracking-[-.02em]">
            Replies within
            <br />
            two working days.
          </div>
          <TextButton href="/work" cursor="enter" magnetic dark mono arrow={null}>
            View the work →
          </TextButton>
        </Reveal>

        <Reveal className="flex justify-between flex-wrap gap-4 mt-[clamp(40px,7vh,70px)] font-mono text-[11px] tracking-[.14em] uppercase opacity-[.4]">
          <span>{site.copyright}</span>
          <span>{site.location.coords}</span>
          <span>{site.builtWith}</span>
        </Reveal>
      </footer>
    </div>
  );
}
