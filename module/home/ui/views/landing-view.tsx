"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BotIcon,
  VideoIcon,
  MicIcon,
  BrainIcon,
  SparklesIcon,
  ArrowRightIcon,
  ZapIcon,
  ShieldIcon,
  GlobeIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import Image from "next/image";

// ── Animated counter ────────────────────────────────────────────────────
function AnimatedNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = 0;
    const duration = 1500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        el.textContent = `${value}${suffix}`;
        clearInterval(timer);
      } else {
        el.textContent = `${Math.floor(start)}${suffix}`;
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── Feature card ────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="group relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ── Step card ───────────────────────────────────────────────────────────
function StepCard({
  step,
  title,
  description,
  delay,
}: {
  step: number;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="relative flex flex-col items-center text-center animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        {description}
      </p>
    </div>
  );
}

// ── Main landing page ────────────────────────────────────────────────────
export default function LandingView() {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg">
              <Image src="/logo.svg" height={36} width={36} alt="MeetAI" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Meet<span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">
                Get Started
                <ArrowRightIcon className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2">
          <div className="h-[500px] w-[800px] rounded-full bg-primary/8 blur-[120px] animate-pulse-slow" />
        </div>
        <div className="pointer-events-none absolute -top-20 right-0">
          <div
            className="h-[300px] w-[400px] rounded-full bg-violet-500/6 blur-[100px] animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="mx-auto max-w-4xl px-4 pt-24 pb-20 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6 animate-fade-in-up">
            <SparklesIcon className="size-3 mr-1.5" />
            AI-Powered Meeting Assistant
          </Badge>

          <h1
            className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Meet with AI agents that{" "}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
              help you grow
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Practice interviews, get coaching, learn languages, review code, and
            more — all through natural voice conversations with specialized AI
            agents.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/sign-up">
                Start Free
                <ArrowRightIcon className="size-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8"
              asChild
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          {/* Stats */}
          <div
            className="mt-16 grid grid-cols-3 gap-8 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div>
              <p className="text-3xl font-bold">
                <AnimatedNumber value={7} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Agent Templates
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                <AnimatedNumber value={6} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">AI Providers</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                <AnimatedNumber value={100} suffix="%" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Voice-Powered
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for AI-powered meetings
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From real-time voice conversations to post-meeting summaries,
              MeetAI has you covered.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={MicIcon}
              title="Real-Time Voice Chat"
              description="Natural voice conversations with AI agents using speech recognition and synthesis — no typing required."
              delay="0s"
            />
            <FeatureCard
              icon={BrainIcon}
              title="Specialized Agents"
              description="Pre-built agent templates for interviews, coaching, language learning, code review, debates, and more."
              delay="0.1s"
            />
            <FeatureCard
              icon={ZapIcon}
              title="Instant Summaries"
              description="AI-generated meeting summaries, action items, and transcripts saved automatically after every session."
              delay="0.2s"
            />
            <FeatureCard
              icon={ShieldIcon}
              title="Bring Your Own Key"
              description="Use your own API keys from OpenAI, Anthropic, Gemini, Groq, or any OpenRouter-compatible provider."
              delay="0.3s"
            />
            <FeatureCard
              icon={VideoIcon}
              title="Meeting Dashboard"
              description="Track all your meetings, view analytics, and pick up where you left off with meeting history."
              delay="0.4s"
            />
            <FeatureCard
              icon={GlobeIcon}
              title="Multi-Provider Support"
              description="Seamlessly switch between AI providers. Configure custom endpoints and models to suit your needs."
              delay="0.5s"
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get started in three simple steps
            </h2>
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            <StepCard
              step={1}
              title="Add Your Credentials"
              description="Connect your AI provider by adding an API key — OpenAI, Anthropic, Gemini, and more."
              delay="0s"
            />
            <StepCard
              step={2}
              title="Create an Agent"
              description="Pick a template or build a custom agent with your own instructions and personality."
              delay="0.15s"
            />
            <StepCard
              step={3}
              title="Start Talking"
              description="Join a meeting and have a natural voice conversation. Get summaries and action items after."
              delay="0.3s"
            />
          </div>
        </div>
      </section>

      {/* ─── Agent templates showcase ──────────────────────────── */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">
              Templates
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready-to-use agent templates
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Start with a pre-configured agent or customize your own.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Job Interviewer",
                desc: "Mock interviews with feedback",
                emoji: "💼",
              },
              { name: "Life Coach", desc: "Goals and motivation", emoji: "🎯" },
              {
                name: "Code Reviewer",
                desc: "Code quality insights",
                emoji: "💻",
              },
              {
                name: "English Teacher",
                desc: "Language practice",
                emoji: "📚",
              },
              {
                name: "Debate Partner",
                desc: "Sharpen arguments",
                emoji: "⚡",
              },
              { name: "Therapist", desc: "CBT-based support", emoji: "🧠" },
              {
                name: "Socratic Teacher",
                desc: "Guided discovery",
                emoji: "🎓",
              },
              { name: "Custom", desc: "Build your own", emoji: "✨" },
            ].map((t, i) => (
              <div
                key={t.name}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl animate-fade-in-up">
            Ready to level up with AI?
          </h2>
          <p
            className="mt-4 text-lg text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Create your first AI meeting in under a minute. No credit card
            required.
          </p>
          <div
            className="mt-8 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button size="lg" className="text-base px-10" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRightIcon className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md">
              <Image src="/logo.svg" height={24} width={24} alt="MeetAI" />
            </div>
            <span className="text-sm font-semibold">MeetAI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MeetAI. Built with Next.js &amp;
            AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
