import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8F2]">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 min-h-dvh flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#EDE8DC_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#D8E5F0_0%,_transparent_60%)] pointer-events-none" />
      <div className="relative max-w-3xl w-full text-center space-y-8">
        <div className="space-y-5">

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1D1B18] leading-[1.08]">
            Write Threads posts
            <br />
            that sound like{" "}
            <span className="text-[#2F4468]">you</span>.
          </h1>
          <p className="text-lg md:text-xl text-[#6B6459] max-w-xl mx-auto leading-relaxed">
            Describe your business, drop a link, and let AI generate authentic posts
            that connect with your audience — not sound like a brand.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-[#1D1B18] px-6 py-3 text-sm font-medium text-white hover:bg-[#2F4468] transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/post"
            className="rounded-xl border border-[#E4DFD3] bg-white px-6 py-3 text-sm font-medium text-[#1D1B18] hover:bg-[#F5F1E8] transition-colors"
          >
            Try the composer
          </Link>
        </div>
        <p className="text-xs text-[#A39C8C]">No credit card required. Connect your Threads account in 60 seconds.</p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Describe your business",
      description: "Tell the AI about your business, your audience, and the vibe you want. You can even drop your website for extra context.",
    },
    {
      number: "02",
      title: "AI generates your post",
      description: "Our engine crafts a post that sounds like a real person — with the right tone, structure, and length for Threads.",
    },
    {
      number: "03",
      title: "Tweak & publish",
      description: "Edit any part before it goes live. Add images, adjust the tone, or regenerate until it's perfect. One click to post.",
    },
  ];

  return (
    <section className="px-6 py-20 md:py-28 min-h-dvh">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8862E]">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1D1B18]">
            From idea to post in seconds
          </h2>
          <p className="text-[#6B6459] max-w-md mx-auto">
            Three simple steps to go from blank page to published post.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-[#EDE8DC] tracking-tighter">{step.number}</span>
                {i < steps.length - 1 && (
                  <div className="hidden md:block flex-1 h-px bg-[#E4DFD3] translate-y-3" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#1D1B18]">{step.title}</h3>
                <p className="text-sm text-[#6B6459] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Authentic voice",
      description: "Our AI writes like a human being — not a marketing robot. No jargon, no fluff, just real conversation.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      ),
    },
    {
      title: "Smart structure",
      description: "Every post is crafted with the perfect hook, context, proof, and call-to-action — optimized for engagement.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      title: "Threads-native",
      description: "Built specifically for Threads. Perfect post length, formatting, and media support — no character limit worries.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      ),
    },
    {
      title: "One-click publish",
      description: "Connect your Threads account once and publish directly from the composer. No copy-pasting between apps.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    },
    {
      title: "X Thread support",
      description: "Generate full X (Twitter) threads too. AI builds each tweet with the right structure — hook, context, reveal, and CTA.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
    },
    {
      title: "Multiple accounts",
      description: "Manage multiple Threads accounts from one dashboard. Switch between accounts and post to the right one instantly.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="px-6 py-20 md:py-28 bg-white min-h-dvh">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8862E]">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1D1B18]">
            Everything you need to post consistently
          </h2>
          <p className="text-[#6B6459] max-w-md mx-auto">
            Stop staring at a blank screen. Start posting content that grows your audience.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E4DFD3] bg-[#FAF8F2] p-6 space-y-4 hover:bg-[#F5F1E8] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E4DFD3] flex items-center justify-center text-[#2F4468]">
                {feature.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-[#1D1B18]">{feature.title}</h3>
                <p className="text-sm text-[#6B6459] leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I was spending 30 minutes on every Threads post. Now it takes me 30 seconds. The AI actually sounds like me.",
      name: "Alex Chen",
      role: "Growth Marketer",
    },
    {
      quote: "Finally, an AI writing tool that doesn't make me sound like a corporate robot. My engagement is up 3x.",
      name: "Sarah Mitchell",
      role: "Solo Founder",
    },
    {
      quote: "The X thread feature is a game-changer. I can repurpose my best Threads content into Twitter threads in seconds.",
      name: "James Wilson",
      role: "Content Creator",
    },
  ];

  return (
    <section className="px-6 py-20 md:py-28 min-h-dvh">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8862E]">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1D1B18]">
            Loved by creators and founders
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-[#E4DFD3] bg-white p-6 space-y-4">
              <svg className="w-6 h-6 text-[#C9C3B5]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.996-1.609 3.612-3.605 3.612-1.078 0-2.054-.467-2.812-1.291zm11.417 0c-1.03-1.094-1.583-2.321-1.583-4.31 0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C21.008 11.69 22.417 13.166 22.417 15c0 1.996-1.609 3.612-3.605 3.612-1.078 0-2.054-.467-2.812-1.291z" />
              </svg>
              <blockquote className="text-sm text-[#6B6459] leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <div>
                <p className="text-sm font-semibold text-[#1D1B18]">{t.name}</p>
                <p className="text-xs text-[#A39C8C]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="px-6 py-20 md:py-28 bg-white min-h-dvh">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1D1B18]">
            Start posting like a person, not a brand
          </h2>
          <p className="text-lg text-[#6B6459] max-w-lg mx-auto leading-relaxed">
            Join creators who use Post Drive to publish authentic content every day.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-[#1D1B18] px-8 py-3.5 text-sm font-medium text-white hover:bg-[#2F4468] transition-colors"
          >
            Create free account
          </Link>
          <Link
            href="/post"
            className="rounded-xl border border-[#E4DFD3] px-8 py-3.5 text-sm font-medium text-[#1D1B18] hover:bg-[#F5F1E8] transition-colors"
          >
            Try the composer
          </Link>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border-[#E4DFD3] px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#1D1B18]">Post Drive</span>
          <span className="text-xs text-[#A39C8C]">AI-powered content for Threads</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-[#A39C8C]">
          <Link href="/login" className="hover:text-[#6B6459] transition-colors">Sign in</Link>
          <Link href="/signup" className="hover:text-[#6B6459] transition-colors">Sign up</Link>
        </div>
        <p className="text-xs text-[#C9C3B5]">&copy; {new Date().getFullYear()} Post Drive.</p>
      </div>
    </footer>
  );
}
