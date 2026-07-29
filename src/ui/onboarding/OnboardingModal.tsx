import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "@/session/SessionContext";
import { hasCompletedOnboarding, markOnboardingComplete } from "@/utils/onboarding";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Handshake,
  Lock,
  Search,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";

type Intent = "buy" | "sell" | null;

const AUTH_PATHS = ["/login", "/register"];

const JOURNEY: {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    id: "find",
    label: "Find it",
    hint: "Browse rooms, kit, and services from verified students.",
    icon: Search,
  },
  {
    id: "agree",
    label: "Agree it",
    hint: "Offer and counter in one chat thread until the price feels right.",
    icon: Handshake,
  },
  {
    id: "pay",
    label: "Pay it",
    hint: "Checkout runs through Pinch. Card in, cash drama out.",
    icon: Lock,
  },
];

const CONFETTI_COLORS = [
  "#EAB308",
  "#22C55E",
  "#F8FAFC",
  "#38BDF8",
  "#F97316",
  "#A3E635",
  "#F472B6",
];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  size: number;
  color: string;
  radius: string;
};

function buildConfetti(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.55,
    duration: 1.8 + Math.random() * 1.6,
    drift: -60 + Math.random() * 120,
    rotate: 180 + Math.random() * 540,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length]!,
    radius: Math.random() > 0.45 ? "2px" : "999px",
  }));
}

/** Full-viewport confetti — portaled so modal overflow can't clip it */
function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo(() => (active ? buildConfetti(72) : []), [active]);
  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-12px] animate-[onboard-confetti-fall_var(--dur)_cubic-bezier(0.22,0.61,0.36,1)_forwards]"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * (0.45 + Math.random() * 0.8),
              backgroundColor: p.color,
              borderRadius: p.radius,
              animationDelay: `${p.delay}s`,
              ["--dur" as string]: `${p.duration}s`,
              ["--drift" as string]: `${p.drift}px`,
              ["--spin" as string]: `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}

/**
 * Celebratory first-session onboarding. Interactive path choice + journey taps,
 * remembered per user in localStorage.
 */
export function OnboardingModal() {
  const { state } = useSession();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState(0);
  const [intent, setIntent] = useState<Intent>(null);
  const [unlocked, setUnlocked] = useState(0);
  const [burst, setBurst] = useState(false);

  const user = state.status === "signedIn" ? state.user : null;
  const onAuthScreen = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "there";
  const uni = user?.university ?? "your uni";

  useEffect(() => {
    if (!user || onAuthScreen) {
      setOpen(false);
      setBurst(false);
      return;
    }
    if (hasCompletedOnboarding(user.id)) return;

    const t = window.setTimeout(() => {
      setPhase(0);
      setIntent(null);
      setUnlocked(0);
      setOpen(true);
      setBurst(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [user, onAuthScreen]);

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(false), 3200);
    return () => window.clearTimeout(t);
  }, [burst]);

  function finish() {
    if (user) markOnboardingComplete(user.id);
    setBurst(false);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) finish();
    else setOpen(true);
  }

  function pickIntent(next: Intent) {
    setIntent(next);
    window.setTimeout(() => setPhase(2), 220);
  }

  function unlockJourney(index: number) {
    if (index > unlocked) return;
    if (index === unlocked) setUnlocked((u) => Math.min(u + 1, JOURNEY.length));
  }

  const journeyDone = unlocked >= JOURNEY.length;

  return (
    <>
      <ConfettiBurst active={burst} />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl ring-1 ring-black/10 sm:max-w-lg"
          showCloseButton={false}
        >
          {phase === 0 && (
            <WelcomePhase
              firstName={firstName}
              uni={uni}
              onContinue={() => setPhase(1)}
              onSkip={finish}
            />
          )}
          {phase === 1 && (
            <IntentPhase
              intent={intent}
              onPick={pickIntent}
              onBack={() => setPhase(0)}
              onSkip={finish}
            />
          )}
          {phase === 2 && (
            <JourneyPhase
              unlocked={unlocked}
              journeyDone={journeyDone}
              onUnlock={unlockJourney}
              onBack={() => setPhase(1)}
              onSkip={finish}
              onContinue={() => {
                setBurst(true);
                setPhase(3);
              }}
            />
          )}
          {phase === 3 && (
            <ReadyPhase firstName={firstName} intent={intent} onFinish={finish} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function WelcomePhase({
  firstName,
  uni,
  onContinue,
  onSkip,
}: {
  firstName: string;
  uni: string;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="bg-gradient-to-b from-nav-from to-nav-to px-7 pb-8 pt-9 text-primary-foreground sm:px-9">
      <DialogHeader className="space-y-3 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Welcome to UniTrade
        </p>
        <DialogTitle className="font-heading text-3xl font-extrabold tracking-tight text-balance text-primary-foreground sm:text-[2rem]">
          You're in, {firstName}!
        </DialogTitle>
        <DialogDescription className="mx-auto max-w-[22rem] text-[0.95rem] leading-relaxed text-primary-foreground/70">
          Campus trade just got a lot less sketchy. A quick walkthrough so you know
          how deals work here.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-verified/35 bg-verified/15 px-3.5 py-1.5 text-sm font-semibold text-verified">
          <Check className="size-4 shrink-0" />
          Verified · {uni}
        </span>
      </div>

      <div className="mt-8 space-y-2">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
          onClick={onContinue}
        >
          Show me around
          <Sparkles className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-xl text-primary-foreground/55 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

function IntentPhase({
  intent,
  onPick,
  onBack,
  onSkip,
}: {
  intent: Intent;
  onPick: (intent: Intent) => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="bg-background px-7 py-8 sm:px-9">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-verified">
          Step 1 of 3
        </p>
        <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight">
          What are you here for?
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Tap one. You can always do both later.
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <IntentCard
          active={intent === "buy"}
          title="I'm buying"
          body="Rooms, kit, and services from verified students."
          icon={Search}
          onClick={() => onPick("buy")}
        />
        <IntentCard
          active={intent === "sell"}
          title="I'm selling"
          body="List what you're done with in a couple of minutes."
          icon={Tag}
          onClick={() => onPick("sell")}
        />
      </div>

      <div className="mt-7 flex items-center justify-between">
        <Button type="button" variant="ghost" className="rounded-xl" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-xl text-muted-foreground"
          onClick={onSkip}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

function IntentCard({
  active,
  title,
  body,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all duration-200",
        "hover:border-primary/35 hover:shadow-sm active:scale-[0.99]",
        active
          ? "border-gold bg-gold/10 ring-2 ring-gold/40"
          : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          active ? "bg-gold text-gold-foreground" : "bg-muted text-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-heading text-base font-bold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </button>
  );
}

function JourneyPhase({
  unlocked,
  journeyDone,
  onUnlock,
  onBack,
  onSkip,
  onContinue,
}: {
  unlocked: number;
  journeyDone: boolean;
  onUnlock: (index: number) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const hintIndex = Math.min(Math.max(unlocked - 1, 0), JOURNEY.length - 1);
  const activeHint = journeyDone
    ? "Nice. You've got the whole loop."
    : unlocked === 0
      ? "Start with Find it, then keep tapping along the path."
      : JOURNEY[hintIndex]!.hint;

  return (
    <div className="bg-background px-7 py-8 sm:px-9">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-verified">
          Step 2 of 3
        </p>
        <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight">
          How a deal works
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Tap each step in order to unlock the next.
        </p>
      </div>

      {/* nodes + connectors that actually meet the circles */}
      <div className="mx-auto mt-10 w-full max-w-sm">
        <div className="flex items-center">
          {JOURNEY.map((beat, i) => {
            const Icon = beat.icon;
            const isOpen = i <= unlocked;
            const isCurrent = i === unlocked && !journeyDone;
            const isComplete = i < unlocked || journeyDone;
            const segmentFilled = unlocked > i;

            return (
              <div key={beat.id} className="contents">
                <button
                  type="button"
                  disabled={!isOpen}
                  onClick={() => onUnlock(i)}
                  aria-label={beat.label}
                  className={cn(
                    "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                    isComplete && "border-verified bg-verified text-white",
                    isCurrent &&
                      "border-gold bg-gold text-gold-foreground shadow-[0_0_0_4px_rgb(234,179,8,0.22)]",
                    !isOpen &&
                      "cursor-not-allowed border-border bg-muted text-muted-foreground",
                    isOpen &&
                      !isCurrent &&
                      !isComplete &&
                      "border-primary/35 bg-background text-foreground",
                  )}
                >
                  {isComplete && i < unlocked ? (
                    <Check className="size-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </button>

                {i < JOURNEY.length - 1 && (
                  <div
                    aria-hidden
                    className="mx-1 h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className={cn(
                        "h-full w-full origin-left rounded-full bg-verified transition-transform duration-400 ease-out",
                        segmentFilled ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex">
          {JOURNEY.map((beat, i) => {
            const isCurrent = i === unlocked && !journeyDone;
            return (
              <div key={beat.id} className="contents">
                <p
                  className={cn(
                    "w-12 shrink-0 text-center font-heading text-[11px] font-bold leading-tight sm:text-xs",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {beat.label}
                </p>
                {i < JOURNEY.length - 1 && <div className="min-w-0 flex-1" />}
              </div>
            );
          })}
        </div>
      </div>

      <div
        key={`${unlocked}-${journeyDone}`}
        className="mt-8 rounded-xl border border-border/80 bg-muted/50 px-4 py-3 text-center"
      >
        <p className="text-sm leading-relaxed text-foreground">{activeHint}</p>
      </div>

      <div className="mt-7 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" className="rounded-xl" onClick={onBack}>
          Back
        </Button>
        {journeyDone ? (
          <Button
            type="button"
            className="rounded-xl bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
            onClick={onContinue}
          >
            I'm ready
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-muted-foreground"
            onClick={onSkip}
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}

function ReadyPhase({
  firstName,
  intent,
  onFinish,
}: {
  firstName: string;
  intent: Intent;
  onFinish: () => void;
}) {
  const preferSell = intent === "sell";

  return (
    <div className="bg-gradient-to-b from-nav-from to-nav-to px-7 pb-8 pt-9 text-primary-foreground sm:px-9">
      <div className="flex justify-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-verified text-white">
          <Check className="size-7" strokeWidth={2.75} />
        </span>
      </div>

      <DialogHeader className="mt-5 space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Step 3 of 3
        </p>
        <DialogTitle className="font-heading text-3xl font-extrabold tracking-tight text-primary-foreground">
          Let's go, {firstName}
        </DialogTitle>
        <DialogDescription className="mx-auto max-w-[22rem] text-[0.95rem] leading-relaxed text-primary-foreground/70">
          {preferSell
            ? "List something you've finished with. A new student will thank you."
            : "Browse what's live on campus, or list something when you're ready."}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-8 space-y-2.5">
        {preferSell ? (
          <>
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
            >
              <Link to="/sell/new" onClick={onFinish}>
                <Tag className="size-4" />
                List something
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/buy" onClick={onFinish}>
                <Search className="size-4" />
                Browse first
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
            >
              <Link to="/buy" onClick={onFinish}>
                <Search className="size-4" />
                Browse the marketplace
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/sell/new" onClick={onFinish}>
                <Tag className="size-4" />
                List something
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
