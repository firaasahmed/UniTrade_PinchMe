import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { MerchantRegistration, MerchantView } from "@/types/Merchant";
import { registerMerchant } from "@/api/merchants-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Landmark, ShieldCheck } from "lucide-react";

const EMPTY: MerchantRegistration = {
  companyName: "",
  companyEmail: "",
  companyRegistrationNumber: "",
  bankAccountRoutingNumber: "",
  bankAccountNumber: "",
  bankAccountName: "",
  contactFirstName: "",
  contactLastName: "",
};

type Submit = { status: "idle" } | { status: "busy" } | { status: "error"; message: string };

function missingFrom(f: MerchantRegistration): Set<string> {
  const miss = new Set<string>();
  if (!f.companyName.trim()) miss.add("companyName");
  if (!f.companyEmail.trim()) miss.add("companyEmail");
  if (!f.bankAccountName.trim()) miss.add("bankAccountName");
  if (!/^\d{6}$/.test(f.bankAccountRoutingNumber)) miss.add("bankAccountRoutingNumber");
  if (!/^\d{3,9}$/.test(f.bankAccountNumber)) miss.add("bankAccountNumber");
  if (!f.contactFirstName.trim()) miss.add("contactFirstName");
  if (!f.contactLastName.trim()) miss.add("contactLastName");
  return miss;
}

export function PayoutSetup({
  defaultName,
  defaultEmail,
  onDone,
}: {
  defaultName: string;
  defaultEmail: string;
  onDone: (view: MerchantView) => void;
}) {
  const [form, setForm] = useState<MerchantRegistration>({
    ...EMPTY,
    companyName: defaultName,
    companyEmail: defaultEmail,
    bankAccountName: defaultName,
  });
  const [revealed, setRevealed] = useState(false);
  const [submit, setSubmit] = useState<Submit>({ status: "idle" });

  const missing = revealed ? missingFrom(form) : new Set<string>();
  const set = (patch: Partial<MerchantRegistration>) => setForm((f) => ({ ...f, ...patch }));
  const busy = submit.status === "busy";

  async function go(): Promise<void> {
    if (missingFrom(form).size > 0) {
      setRevealed(true);
      return;
    }
    setSubmit({ status: "busy" });
    try {
      const view = await registerMerchant(form);
      toast.success("Payout account registered");
      onDone(view);
    } catch (e) {
      setSubmit({ status: "error", message: e instanceof Error ? e.message : "something went wrong" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border border-verified/30 bg-verified/5 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-verified" />
        <p className="text-sm text-muted-foreground">
          Money from your listings goes <span className="font-medium text-foreground">straight to this account</span>.
          UniTrade never holds it — we can't, the payment isn't ours to touch.
        </p>
      </div>

      <Group title="Your business">
        <Field label="Business name" htmlFor="companyName" error={missing.has("companyName")}>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => set({ companyName: e.target.value })}
            placeholder="Nest & Key Realty"
            aria-invalid={missing.has("companyName")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business email" htmlFor="companyEmail" error={missing.has("companyEmail")}>
            <Input
              id="companyEmail"
              type="email"
              value={form.companyEmail}
              onChange={(e) => set({ companyEmail: e.target.value })}
              aria-invalid={missing.has("companyEmail")}
            />
          </Field>
          <Field label="ABN" htmlFor="abn" hint="Optional">
            <Input
              id="abn"
              inputMode="numeric"
              value={form.companyRegistrationNumber ?? ""}
              onChange={(e) => set({ companyRegistrationNumber: e.target.value.replace(/\D/g, "") })}
              placeholder="51 824 753 556"
            />
          </Field>
        </div>
      </Group>

      <Group title="Where you get paid" hint="An Australian bank account in the business's name.">
        <Field label="Account name" htmlFor="bankAccountName" error={missing.has("bankAccountName")}>
          <Input
            id="bankAccountName"
            value={form.bankAccountName}
            onChange={(e) => set({ bankAccountName: e.target.value })}
            aria-invalid={missing.has("bankAccountName")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="BSB" htmlFor="bsb" error={missing.has("bankAccountRoutingNumber")}>
            <Input
              id="bsb"
              inputMode="numeric"
              maxLength={7}
              value={form.bankAccountRoutingNumber}
              onChange={(e) => set({ bankAccountRoutingNumber: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="062000"
              aria-invalid={missing.has("bankAccountRoutingNumber")}
            />
          </Field>
          <Field label="Account number" htmlFor="acct" error={missing.has("bankAccountNumber")}>
            <Input
              id="acct"
              inputMode="numeric"
              maxLength={9}
              value={form.bankAccountNumber}
              onChange={(e) => set({ bankAccountNumber: e.target.value.replace(/\D/g, "").slice(0, 9) })}
              placeholder="12345678"
              aria-invalid={missing.has("bankAccountNumber")}
            />
          </Field>
        </div>
      </Group>

      <Group title="Who we contact" hint="The person responsible for this account.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="contactFirstName" error={missing.has("contactFirstName")}>
            <Input
              id="contactFirstName"
              value={form.contactFirstName}
              onChange={(e) => set({ contactFirstName: e.target.value })}
              aria-invalid={missing.has("contactFirstName")}
            />
          </Field>
          <Field label="Last name" htmlFor="contactLastName" error={missing.has("contactLastName")}>
            <Input
              id="contactLastName"
              value={form.contactLastName}
              onChange={(e) => set({ contactLastName: e.target.value })}
              aria-invalid={missing.has("contactLastName")}
            />
          </Field>
        </div>
      </Group>

      {submit.status === "error" && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {submit.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t pt-5">
        <p className="text-xs text-muted-foreground">
          We never see or store card details. This is only where money lands.
        </p>
        <Button onClick={() => void go()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Landmark className="size-4" />}
          Register
        </Button>
      </div>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-muted/40 p-4">
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4 [&_input]:bg-background">{children}</div>
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
      <div className="mb-1.5 flex items-center justify-between">
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {error && <AlertCircle className="size-3.5" />}
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
