import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getListing, createListing, updateListing } from "@/api/listings-api";
import {
  EMPTY_DRAFT,
  LIMITS,
  LEASE_TERMS,
  toCents,
  type Draft,
  type StepId,
  stepsFor,
  stepValidity,
  missingFields,
  draftToNewListing,
  listingToDraft,
} from "@/utils/listing-draft";
import { formatPrice } from "@/utils/format";
import { useSession } from "@/session/SessionContext";
import { KINDS, ITEM_CATEGORIES, categoryIcon, categoryForKind, type ListingKind } from "@/utils/categories";
import { ListingPreview } from "@/ui/create/ListingPreview";
import { ImagesField } from "@/ui/create/ImagesField";
import { DateField } from "@/ui/create/DateField";
import { AddressField, publicLocation } from "@/ui/create/AddressField";
import { InspectionAvailabilityField } from "@/ui/create/InspectionAvailabilityField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Tag,
  CalendarClock,
  Send,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";

type Submit = { status: "idle" } | { status: "busy" } | { status: "error"; message: string };

// a lease can't start in the past
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

// a desk and a share house need different prompting — one place so they stay in step
const PLACEHOLDERS: Record<ListingKind, { title: string; description: string; meetup: string }> = {
  item: {
    title: "e.g. IKEA desk, white, great condition",
    description:
      "Describe the condition, what's included, and why you're selling. Honest listings sell faster.",
    meetup: "Meet on campus",
  },
  service: {
    title: "e.g. Maths and stats tutoring, first-year units",
    description:
      "What you offer, how you work, and what a session looks like. Mention anything that shows you know your stuff.",
    meetup: "On campus, your place, or online",
  },
  accommodation: {
    title: "e.g. Sunny room in a share house, 10 min to campus",
    description:
      "What's included, who else lives there, how inspections work, and what the area is like.",
    meetup: "Inspection by appointment",
  },
};

const STEP_META: Record<StepId, { title: string; heading: string; hint?: string; icon: typeof Tag }> = {
  details: {
    title: "Details",
    heading: "What are you listing?",
    icon: ClipboardList,
  },
  place: {
    title: "Price & place",
    heading: "What are you asking, and where is it?",
    hint: "Your exact address stays private — buyers only see the suburb.",
    icon: Tag,
  },
  inspection: {
    title: "Inspections",
    heading: "When can people visit?",
    hint: "Pick the days and times you're around. Buyers book a slot from these.",
    icon: CalendarClock,
  },
  review: {
    title: "Review",
    heading: "Check it over",
    hint: "Everything you entered. The card buyers see is on the right.",
    icon: Send,
  },
};

export function CreateListing({ editId, presetKind }: { editId?: string; presetKind?: ListingKind }) {
  const navigate = useNavigate();
  const { state } = useSession();
  const sellerName = state.status === "signedIn" ? state.user.name : "You";

  const [draft, setDraft] = useState<Draft>(() =>
    presetKind ? { ...EMPTY_DRAFT, kind: presetKind, category: categoryForKind(presetKind) } : EMPTY_DRAFT,
  );
  const [step, setStep] = useState<StepId>("details");
  const [revealed, setRevealed] = useState<Set<StepId>>(new Set());
  // inspection has no required fields, so "valid" alone would tick it unseen
  const [visited, setVisited] = useState<Set<StepId>>(new Set(["details"]));
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
          const loaded = listingToDraft(l);
          setDraft(loaded);
          // an existing listing has been through every step already
          setVisited(new Set(stepsFor(loaded.kind)));
          setLoadState("idle");
        }
      })
      .catch(() => active && setLoadState("error"));
    return () => {
      active = false;
    };
  }, [editId]);

  const steps = stepsFor(draft.kind);
  const valid = stepValidity(draft);
  const missing = revealed.has(step) ? missingFields(draft, step) : new Set<string>();
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // switching kind can drop the step you're on, so fall back to the first
  const index = steps.indexOf(step);
  const at = index === -1 ? 0 : index;
  const current = steps[at] as StepId;

  useEffect(() => {
    setVisited((v) => (v.has(current) ? v : new Set(v).add(current)));
  }, [current]);

  function chooseKind(kind: ListingKind) {
    set({ kind, category: categoryForKind(kind) });
  }

  function canReach(target: StepId): boolean {
    const t = steps.indexOf(target);
    if (t <= at) return true;
    return steps.slice(0, t).every((s) => valid[s]);
  }

  function goTo(target: StepId) {
    if (canReach(target)) {
      setStep(target);
      return;
    }
    // reveal the first blocking step so the user sees what's missing
    const t = steps.indexOf(target);
    const blocking = steps.slice(0, t).find((s) => !valid[s]);
    if (blocking) {
      setRevealed((r) => new Set(r).add(blocking));
      setStep(blocking);
    }
  }

  function next() {
    if (!valid[current]) {
      setRevealed((r) => new Set(r).add(current));
      return;
    }
    const nextStep = steps[at + 1];
    if (nextStep) setStep(nextStep);
  }

  function back() {
    const prev = steps[at - 1];
    if (prev) setStep(prev);
    else navigate(-1);
  }

  async function finish(status: "active" | "draft") {
    if (status === "draft" && draft.title.trim() === "") {
      toast.error("Add a title before saving a draft");
      setStep("details");
      setRevealed((r) => new Set(r).add("details"));
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
  const meta = STEP_META[current];
  const isLast = at === steps.length - 1;

  return (
    <div>
      {/* the step rail says where you are, so the heading is only for screen readers */}
      <h1 className="sr-only">{isEdit ? "Edit your listing" : "List something"}</h1>

      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[156px_minmax(0,1fr)_320px] lg:gap-y-8">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <StepRail
            steps={steps}
            current={current}
            valid={valid}
            visited={visited}
            canReach={canReach}
            onGo={goTo}
          />
        </div>

        <div className="min-w-0">
          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold">{meta.heading}</h2>
                {meta.hint && <p className="mt-1 text-sm text-muted-foreground">{meta.hint}</p>}
              </div>

              {/* up here rather than in the action row, which ran out of width */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0 lg:hidden">
                    <Eye className="size-4" />
                    Preview
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Live preview</SheetTitle>
                    <SheetDescription>How your card looks to buyers</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <ListingPreview draft={draft} sellerName={sellerName} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {current === "details" && (
              <StepDetails
                draft={draft}
                missing={missing}
                set={set}
                onKind={chooseKind}
                onCategory={(c) => set({ category: c })}
              />
            )}
            {current === "place" && <StepPlace draft={draft} missing={missing} set={set} />}
            {current === "inspection" && <StepInspection draft={draft} set={set} />}
            {current === "review" && <StepReview draft={draft} />}

            {submit.status === "error" && (
              <p className="mt-4 text-sm text-destructive">{submit.message}</p>
            )}

            <div className="mt-6 flex items-center justify-between gap-2 border-t pt-5">
              <div className="flex items-center gap-1">
                <Button variant="outline" onClick={back} disabled={busy}>
                  <ArrowLeft className="size-4" />
                  {at === 0 ? "Cancel" : "Back"}
                </Button>
                {/* a way out from any step — Back already reads "Cancel" at step one,
                    and on a phone there isn't width for both */}
                {at > 0 && (
                  <Button
                    variant="ghost"
                    className="hidden sm:inline-flex"
                    onClick={() => navigate(-1)}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => void finish("draft")} disabled={busy}>
                  <span className="sm:hidden">Draft</span>
                  <span className="hidden sm:inline">Save draft</span>
                </Button>
                {isLast ? (
                  <Button onClick={() => void finish("active")} disabled={busy || !valid.review}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {isEdit ? "Save & publish" : "Publish"}
                  </Button>
                ) : (
                  <Button onClick={next} disabled={busy}>
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* beside the form on wide screens; behind a button on narrow ones, so the
            card is one tap away instead of a scroll to the bottom */}
        <div className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Live preview</p>
          <ListingPreview draft={draft} sellerName={sellerName} />
        </div>
      </div>
    </div>
  );
}

function StepRail({
  steps,
  current,
  valid,
  visited,
  canReach,
  onGo,
}: {
  steps: StepId[];
  current: StepId;
  valid: Record<StepId, boolean>;
  visited: Set<StepId>;
  canReach: (t: StepId) => boolean;
  onGo: (t: StepId) => void;
}) {
  return (
    // horizontal strip on small screens, a column beside the form from lg up
    <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
      <div className="flex w-max items-center gap-1 sm:gap-2 lg:w-full lg:flex-col lg:items-stretch lg:gap-1">
        {steps.map((id, i) => {
          const active = current === id;
          const done = valid[id] && visited.has(id) && !active;
          const reachable = canReach(id);
          const Icon = done ? Check : STEP_META[id].icon;
          return (
            <div key={id} className="flex items-center gap-1 sm:gap-2 lg:w-full">
              <button
                type="button"
                onClick={() => onGo(id)}
                disabled={!reachable}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors lg:w-full lg:justify-start lg:rounded-lg lg:py-2",
                  active && "border-primary bg-primary text-primary-foreground",
                  !active && done && "border-verified/40 bg-verified/10 text-verified",
                  !active && !done && reachable && "border-border text-muted-foreground hover:bg-accent",
                  !reachable && "cursor-not-allowed border-dashed text-muted-foreground/50",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {/* narrow screens name only where you are — the rest stay icons so
                    the strip still fits without becoming a scroller */}
                <span className={cn("font-medium", active ? "inline" : "hidden sm:inline")}>
                  {STEP_META[id].title}
                </span>
              </button>
              {i < steps.length - 1 && <span className="h-px w-3 bg-border sm:w-5 lg:hidden" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails({
  draft,
  missing,
  set,
  onKind,
  onCategory,
}: {
  draft: Draft;
  missing: Set<string>;
  set: (patch: Partial<Draft>) => void;
  onKind: (k: ListingKind) => void;
  onCategory: (c: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* no FieldGroup — its padding cost 32px of width, which is the difference
          between "Accommodation" fitting a third of a phone and not */}
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => onKind(k.value)}
            className={cn(
              "rounded-xl border bg-background px-1 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:py-4 sm:text-sm",
              draft.kind === k.value
                ? "border-primary ring-2 ring-primary/20"
                : "text-muted-foreground hover:border-border hover:bg-accent/50",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {draft.kind === "item" && (
        <FieldGroup>
          <FieldLabel label="Category" hint="Drives search and filtering" error={missing.has("category")} />

          {/* a grid, not a dropdown — dropdown rows came out 28px tall against a
              44px minimum, and cost two taps instead of one */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {ITEM_CATEGORIES.map((c) => {
              const Icon = categoryIcon(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCategory(c)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border bg-background px-1.5 text-xs transition-colors sm:min-h-0 sm:justify-start sm:rounded-full sm:px-3 sm:py-1.5 sm:text-sm",
                    draft.category === c
                      ? "border-primary ring-2 ring-primary/20"
                      : "text-muted-foreground hover:bg-accent/50",
                    missing.has("category") && "border-destructive/50",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {c}
                </button>
              );
            })}
          </div>
          {missing.has("category") && (
            <p className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="size-3.5" />
              Pick a category to continue
            </p>
          )}
        </FieldGroup>
      )}

      <FieldGroup>
        {/* photos sit beside the text and stretch to its height */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_168px]">
          <div className="space-y-4">
            <Field
              label="Title"
              htmlFor="title"
              error={missing.has("title")}
              hint={`${draft.title.length}/${LIMITS.title}`}
            >
              <Input
                id="title"
                value={draft.title}
                maxLength={LIMITS.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder={PLACEHOLDERS[draft.kind].title}
                aria-invalid={missing.has("title")}
              />
            </Field>

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
                // field-sizing-content ignores rows, so the floor has to be a height
                className="min-h-32"
                onChange={(e) => set({ description: e.target.value })}
                placeholder={PLACEHOLDERS[draft.kind].description}
                aria-invalid={missing.has("description")}
              />
            </Field>
          </div>

          <div className="flex flex-col">
            <FieldLabel label="Photos" hint="First is cover" />
            <div className="min-h-0 flex-1">
              <ImagesField images={draft.images} onChange={(images) => set({ images })} />
            </div>
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}

function StepPlace({
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
    <div className="space-y-4">
      <FieldGroup>
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

          {draft.kind === "accommodation" && (
            <Field label="Bond ($)" htmlFor="bond" hint="Optional">
              <Input
                id="bond"
                inputMode="decimal"
                value={draft.bondDollars}
                onChange={(e) => set({ bondDollars: e.target.value })}
                placeholder="0"
              />
            </Field>
          )}
        </div>
      </FieldGroup>

      <FieldGroup hint="Start typing an address and pick from the list, so we can match it to a real place.">
        <AddressField
          id="location"
          place={draft.place}
          invalid={missing.has("location")}
          onPick={(place) => set({ place, location: place ? publicLocation(place.formatted) : "" })}
        />
      </FieldGroup>

      {draft.kind !== "accommodation" && (
        <FieldGroup>
          <Field label="Meetup" htmlFor="meetup" hint="Optional">
            <Input
              id="meetup"
              value={draft.meetup}
              maxLength={LIMITS.meetup}
              onChange={(e) => set({ meetup: e.target.value })}
              placeholder={PLACEHOLDERS[draft.kind].meetup}
            />
          </Field>
        </FieldGroup>
      )}

      {draft.kind === "accommodation" && (
        <FieldGroup hint="All optional, but rooms and availability get far more enquiries.">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bedrooms" htmlFor="bedrooms">
              <Input
                id="bedrooms"
                inputMode="numeric"
                value={draft.bedrooms}
                onChange={(e) => set({ bedrooms: e.target.value })}
                placeholder="1"
              />
            </Field>
            <Field label="Bathrooms" htmlFor="bathrooms">
              <Input
                id="bathrooms"
                inputMode="numeric"
                value={draft.bathrooms}
                onChange={(e) => set({ bathrooms: e.target.value })}
                placeholder="1"
              />
            </Field>
          </div>

          <Field label="Available from" htmlFor="available">
            <DateField
              id="available"
              value={draft.availableFrom}
              onChange={(v) => set({ availableFrom: v })}
              fromDate={toDate(today())}
              placeholder="Pick a date"
            />
          </Field>

          <div>
            <FieldLabel label="Lease length" hint="Optional" />
            <div className="flex flex-wrap gap-2">
              {LEASE_TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set({ leaseTerm: draft.leaseTerm === t ? "" : t })}
                  className={cn(
                    "rounded-full border bg-background px-3 py-1.5 text-sm transition-colors",
                    draft.leaseTerm === t
                      ? "border-primary font-medium ring-2 ring-primary/20"
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
        </FieldGroup>
      )}
    </div>
  );
}

function StepInspection({ draft, set }: { draft: Draft; set: (patch: Partial<Draft>) => void }) {
  return (
    <FieldGroup>
      <InspectionAvailabilityField
        value={draft.inspection}
        onChange={(inspection) => set({ inspection })}
      />
    </FieldGroup>
  );
}

function StepReview({ draft }: { draft: Draft }) {
  const bondCents = toCents(draft.bondDollars);
  const priceCents = toCents(draft.priceDollars);
  const unit = draft.kind === "service" ? " / hr" : draft.kind === "accommodation" ? " / week" : "";

  const rows: { label: string; value: string }[] = [
    { label: "Type", value: KINDS.find((k) => k.value === draft.kind)?.label ?? draft.kind },
    { label: "Category", value: draft.category },
    { label: "Title", value: draft.title },
    {
      label: draft.kind === "accommodation" ? "Rent" : "Price",
      value: priceCents !== undefined ? `${formatPrice(priceCents)}${unit}` : "",
    },
    { label: "Photos", value: draft.images.length > 0 ? `${draft.images.length} added` : "" },
    { label: "Suburb shown", value: draft.location },
    { label: "Exact address", value: draft.place?.formatted ?? "" },
  ];

  if (draft.kind === "accommodation") {
    rows.push(
      { label: "Bedrooms", value: draft.bedrooms },
      { label: "Bathrooms", value: draft.bathrooms },
      { label: "Furnished", value: draft.furnished ? "Yes" : "No" },
      { label: "Bond", value: bondCents !== undefined && bondCents > 0 ? formatPrice(bondCents) : "" },
      { label: "Available from", value: draft.availableFrom },
      { label: "Lease length", value: draft.leaseTerm },
    );
  } else {
    rows.push(
      { label: draft.kind === "service" ? "Availability" : "Condition", value: draft.condition },
      { label: "Meetup", value: draft.meetup },
    );
  }

  return (
    <FieldGroup hint="Anything blank is simply left off the listing.">
      <dl className="divide-y">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-4 py-2 text-sm">
            <dt className="w-32 shrink-0 text-muted-foreground">{r.label}</dt>
            <dd className={cn("min-w-0 flex-1 break-words", r.value ? "font-medium" : "text-muted-foreground/60")}>
              {r.value || "Not set"}
            </dd>
          </div>
        ))}
        <div className="flex gap-4 py-2 text-sm">
          <dt className="w-32 shrink-0 text-muted-foreground">Description</dt>
          <dd
            className={cn(
              "min-w-0 flex-1 whitespace-pre-wrap break-words",
              draft.description.trim() ? "font-medium" : "text-muted-foreground/60",
            )}
          >
            {draft.description.trim() || "Not set"}
          </dd>
        </div>
      </dl>
    </FieldGroup>
  );
}

// a panel with its own background, so a step reads as groups not one long list.
// the title is optional — a heading that just restates the fields is noise
function FieldGroup({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-muted/40 p-4">
      {title && <h3 className="font-heading text-sm font-semibold">{title}</h3>}
      {hint && <p className={cn("text-xs text-muted-foreground", title && "mt-0.5")}>{hint}</p>}
      <div
        className={cn(
          "space-y-4 [&_input]:bg-background [&_textarea]:bg-background",
          (title ?? hint) && "mt-4",
        )}
      >
        {children}
      </div>
    </section>
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
