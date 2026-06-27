import Kicker from "@/components/ui/Kicker";
import TextButton from "@/components/ui/TextButton";

export default function NotFound() {
  return (
    <main className="relative z-[1] flex min-h-screen flex-col justify-center px-gutter">
      <Kicker className="mb-[clamp(20px,4vh,40px)]">Error — 404</Kicker>
      <h1 className="max-w-[14ch] font-serif text-[clamp(46px,9.2vw,168px)] font-normal leading-[0.96] tracking-[-.025em]">
        This page drifted <span className="italic">off the edge.</span>
      </h1>
      <p className="mt-[clamp(24px,4vh,40px)] max-w-[44ch] text-[clamp(14px,1.4vw,17px)] leading-[1.55] opacity-[.72]">
        The thing you were after isn&rsquo;t here. Let&rsquo;s get you back to something solid.
      </p>
      <div className="mt-[clamp(28px,5vh,48px)]">
        <TextButton href="/" cursor="home" magnetic>
          Back to the start
        </TextButton>
      </div>
    </main>
  );
}
