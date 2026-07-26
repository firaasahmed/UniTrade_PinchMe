import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getListing, createListing, updateListing } from "@/api/listings-api";
import {
  EMPTY_DRAFT,
  LIMITS,
  LEASE_TERMS,
  type Draft,
  type StepId,
  stepValidity,
  missingFields,
  draftToNewListing,
  listingToDraft,
} from "@/utils/listing-draft";
import { useSession } from "@/session/SessionContext";
import { KINDS, ITEM_CATEGORIES, categoryIcon, categoryForKind, type ListingKind } from "@/utils/categories";
import { ListingPreview } from "@/ui/create/ListingPreview";
import { ImagesField } from "@/ui/create/ImagesField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ClipboardList,
  Tag,
  FileText,
  Send,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Submit = { status: "idle" } | { status: "busy" } | { status: "error"; message: string };

// a lease can't start in the past
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const STEPS: { id: StepId; title: string; icon: typeof LayoutGrid }[] = [
  { id: 0, title: "Type", icon: LayoutGrid },
  { id: 1, title: "Details", icon: ClipboardList },
  { id: 2, title: "Pricing", icon: Tag },
  { id: 3, title: "Description", icon: FileText },
  { id: 4, title: "Review", icon: Send },
];

export function CreateListing({ editId, presetKind }: { editId?: string; presetKind?: ListingKind }) {
  const navigate = useNavigate();
  const { state } = useSession();
  const sellerName = state.status === "signedIn" ? state.user.name : "You";

  const [draft, setDraft] = useState<Draft>(() =>
    presetKind ? { ...EMPTY_DRAFT, kind: presetKind, category: categoryForKind(presetKind) } : EMPTY_DRAFT,
  );
  const [step, setStep] = useState<StepId>(0);
  const [revealed, setRevealed] = useState<Set<StepId>>(new Set());
  const [submit, setSubmit] = useState<Submit>({ status: "idle" });
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(editId ? "loading" : "idle");

  const isEdit = Boolean(editId);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    setLoadState("loading");
    getListing(editId)
      .then((l) => {
        if (active) {
          setDraft(listingToDraft(l));
          setLoadState("idle");
        }
      })
      .catch(() => active && setLoadState("error"));
    return () => {
      active = false;
    };
  }, [editId]);

  const valid = stepValidity(draft);
  const missing = revealed.has(step) ? missingFields(draft, step) : new Set<string>();
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  function chooseKind(kind: ListingKind) {
    set({ kind, category: categoryForKind(kind) });
  }

  function canReach(target: StepId): boolean {
    if (target <= step) return true;
    for (let i = 0; i < target; i++) if (!valid[i as StepId]) return false;
    return true;
  }

  function goTo(target: StepId) {
    if (canReach(target)) {
      setStep(target);
    } else {
      // reveal the first blocking step so the user sees what's missing
      const blocking = ([0, 1, 2, 3] as StepId[]).find((i) => i < target && !valid[i]);
      if (blocking !== undefined) {
        setRevealed((r) => new Set(r).add(blocking));
        setStep(blocking);
      }
    }
  }

  function next() {
    if (valid[step]) setStep((s) => Math.min(4, s + 1) as StepId);
    else setRevealed((r) => new Set(r).add(step));
  }

  function back() {
    if (step === 0) navigate(-1);
    else setStep((s) => (s - 1) as StepId);
  }

  async function finish(status: "active" | "draft") {
    if (status === "draft" && draft.title.trim() === "") {
      toast.error("Add a title before saving a draft");
      setStep(1);
      setRevealed((r) => new Set(r).add(1));
      return;
    }
    const input = draftToNewListing(draft, status);
    if (!input) {
      toast.error("Add a valid price to publish");
      return;
    }
    setSubmit({ status: "busy" });
    try {
      const listing = isEdit
        ? await updateListing(editId as string, { ...input, status })
        : await createListing(input);
      if (status === "draft") {
        toast.success(isEdit ? "Draft updated" : "Draft saved");
        navigate("/sell?tab=drafts");
      } else {
        toast.success(isEdit ? "Listing updated" : "Listing published");
        navigate(`/listing/${listing.id}`);
      }
    } catch (e) {
      setSubmit({ status: "error", message: e instanceof Error ? e.message : "something went wrong" });
    }
  }

  if (loadState === "loading") return <EditLoading />;
  if (loadState === "error")
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-destructive">Couldn't load this listing to edit.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/sell")}>
          Back to my listings
        </Button>
      </div>
    );

  const busy = submit.status === "busy";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            {isEdit ? "Edit your listing" : "List something"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? "Update the details and republish." : "Reach verified students on your campus."}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <StepRail step={step} valid={valid} canReach={canReach} onGo={goTo} />

          <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            {step === 0 && <StepType draft={draft} missing={missing} onKind={chooseKind} onCategory={(c) => set({ category: c })} />}
            {step === 1 && <StepDetails draft={draft} missing={missing} set={set} />}
            {step === 2 && <StepPricing draft={draft} missing={missing} set={set} />}
            {step === 3 && <StepDescription draft={draft} missing={missing} set={set} />}
            {step === 4 && <StepReview draft={draft} sellerName={sellerName} />}

            {submit.status === "error" && (
              <p className="mt-4 text-sm text-destructive">{submit.message}</p>
            )}

            <div className="mt-6 flex items-center justify-between gap-2 border-t pt-5">
              <Button variant="outline" onClick={back} disabled={busy}>
                <ArrowLeft className="size-4" />
                {step === 0 ? "Cancel" : "Back"}
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => void finish("draft")} disabled={busy}>
                  Save draft
                </Button>
                {step < 4 ? (
                  <Button onClick={next} disabled={busy}>
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button onClick={() => void finish("active")} disabled={busy || !valid[4]}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {isEdit ? "Save & publish" : "Publish"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Live preview</p>
          <ListingPreview draft={draft} sellerName={sellerName} />
        </div>
      </div>
    </div>
  );
}

function StepRail({
  step,
  valid,
  canReach,
  onGo,
}: {
  step: StepId;
  valid: Record<StepId, boolean>;
  canReach: (t: StepId) => boolean;
  onGo: (t: StepId) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex w-max items-center gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = valid[s.id] && !active;
          const reachable = canReach(s.id);
          const Icon = done ? Check : s.icon;
          return (
            <div key={s.id} className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onGo(s.id)}
                disabled={!reachable}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active && "border-primary bg-primary text-primary-foreground",
                  !active && done && "border-verified/40 bg-verified/10 text-verified",
                  !active && !done && reachable && "border-border text-muted-foreground hover:bg-accent",
                  !reachable && "cursor-not-allowed border-dashed text-muted-foreground/50",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden font-medium sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-3 bg-border sm:w-5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepType({
  draft,
  missing,
  onKind,
  onCategory,
}: {
  draft: Draft;
  missing: Set<string>;
  onKind: (k: ListingKind) => void;
  onCategory: (c: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">What are you listing?</Label>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => onKind(k.value)}
              className={cn(
                "rounded-xl border px-3 py-4 text-sm font-medium transition-colors",
                draft.kind === k.value
                  ? "border-primary bg-accent"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {draft.kind === "item" && (
        <div>
          <FieldLabel label="Category" error={missing.has("category")} />
          <div className="flex flex-wrap gap-2">
            {ITEM_CATEGORIES.map((c) => {
              const Icon = categoryIcon(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCategory(c)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    draft.category === c
                      ? "border-primary bg-accent"
                      : "text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="size-3.5" />
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {draft.kind !== "item" && (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {draft.kind === "service"
            ? "Listing a service. You'll set your hourly rate next."
            : "Listing accommodation. You'll add rooms, bond and availability next."}
        </p>
      )}
    </div>
  );
}

function StepDetails({
  draft,
  missing,
  set,
}: {
  draft: Draft;
  missing: Set<string>;
  set: (patch: Partial<Draft>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Title" htmlFor="title" error={missing.has("title")} hint={`${draft.title.length}/${LIMITS.title}`}>
        <Input
          id="title"
          value={draft.title}
          maxLength={LIMITS.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. IKEA desk, white, great condition"
          aria-invalid={missing.has("title")}
        />
      </Field>

      <div>
        <FieldLabel label="Photos" hint="First photo is the cover" />
        <ImagesField images={draft.images} onChange={(images) => set({ images })} />
      </div>
    </div>
  );
}

function StepPricing({
  draft,
  missing,
  set,
}: {
  draft: Draft;
  missing: Set<string>;
  set: (patch: Partial<Draft>) => void;
}) {
  const priceLabel =
    draft.kind === "service" ? "Rate ($ per hour)" : draft.kind === "accommodation" ? "Rent ($ per week)" : "Price ($)";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={priceLabel} htmlFor="price" error={missing.has("price")}>
          <Input
            id="price"
            inputMode="decimal"
            value={draft.priceDollars}
            onChange={(e) => set({ priceDollars: e.target.value })}
            placeholder="0"
            aria-invalid={missing.has("price")}
          />
        </Field>
        {draft.kind === "item" && (
          <Field label="Condition" htmlFor="condition" error={missing.has("condition")}>
            <Input
              id="condition"
              value={draft.condition}
              onChange={(e) => set({ condition: e.target.value })}
              placeholder="e.g. Used · good"
              aria-invalid={missing.has("condition")}
            />
          </Field>
        )}
        {draft.kind === "service" && (
          <Field label="Availability" htmlFor="condition">
            <Input
              id="condition"
              value={draft.condition}
              onChange={(e) => set({ condition: e.target.value })}
              placeholder="e.g. Weekends, available now"
            />
          </Field>
        )}
      </div>

      <Field label="Location" htmlFor="location" error={missing.has("location")}>
        <Input
          id="location"
          value={draft.location}
          maxLength={LIMITS.location}
          onChange={(e) => set({ location: e.target.value })}
          placeholder="Suburb, State"
          aria-invalid={missing.has("location")}
        />
      </Field>

      <Field
        label={draft.kind === "accommodation" ? "Inspection" : "Meetup"}
        htmlFor="meetup"
        error={missing.has("meetup")}
      >
        <Input
          id="meetup"
          value={draft.meetup}
          maxLength={LIMITS.meetup}
          onChange={(e) => set({ meetup: e.target.value })}
          placeholder={draft.kind === "accommodation" ? "Inspection by appointment" : "Meet on campus"}
          aria-invalid={missing.has("meetup")}
        />
      </Field>

      {draft.kind === "accommodation" && (
        <div className="space-y-4 rounded-xl border border-dashed p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms" htmlFor="bedrooms">
              <Input id="bedrooms" inputMode="numeric" value={draft.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} placeholder="1" />
            </Field>
            <Field label="Bathrooms" htmlFor="bathrooms">
              <Input id="bathrooms" inputMode="numeric" value={draft.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} placeholder="1" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bond ($)" htmlFor="bond">
              <Input id="bond" inputMode="decimal" value={draft.bondDollars} onChange={(e) => set({ bondDollars: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Available from" htmlFor="available">
              <Input
                id="available"
                type="date"
                min={today()}
                value={draft.availableFrom}
                onChange={(e) => set({ availableFrom: e.target.value })}
              />
            </Field>
          </div>

          <div>
            <FieldLabel label="Lease length" hint="Optional" />
            <div className="flex flex-wrap gap-2">
              {LEASE_TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set({ leaseTerm: draft.leaseTerm === t ? "" : t })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    draft.leaseTerm === t
                      ? "border-primary bg-accent font-medium"
                      : "text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              className="mt-2"
              value={draft.leaseTerm}
              maxLength={LIMITS.meetup}
              onChange={(e) => set({ leaseTerm: e.target.value })}
              placeholder="or type it, e.g. until end of semester 2"
              aria-label="Lease length"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.furnished} onCheckedChange={(v) => set({ furnished: v })} />
            Furnished
          </label>
        </div>
      )}
    </div>
  );
}

function StepDescription({
  draft,
  missing,
  set,
}: {
  draft: Draft;
  missing: Set<string>;
  set: (patch: Partial<Draft>) => void;
}) {
  return (
    <Field
      label="Description"
      htmlFor="description"
      error={missing.has("description")}
      hint={`${draft.description.length}/${LIMITS.description}`}
    >
      <Textarea
        id="description"
        value={draft.description}
        maxLength={LIMITS.description}
        rows={7}
        onChange={(e) => set({ description: e.target.value })}
        placeholder="Describe the condition, what's included, and why you're selling. Honest listings sell faster."
        aria-invalid={missing.has("description")}
      />
    </Field>
  );
}

function StepReview({ draft, sellerName }: { draft: Draft; sellerName: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Here's how your listing will appear. Publish when you're happy, or save it as a draft.
      </p>
      <div className="max-w-xs">
        <ListingPreview draft={draft} sellerName={sellerName} />
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel label={label} htmlFor={htmlFor} error={error} hint={hint} />
      {children}
    </div>
  );
}

function FieldLabel({
  label,
  htmlFor,
  error,
  hint,
}: {
  label: string;
  htmlFor?: string;
  error?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
        {error && <AlertCircle className="size-3.5" />}
        {label}
      </Label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function EditLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}
