import type { MerchantView } from "@/types/Merchant";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Landmark } from "lucide-react";

// one rendering per state — the same parity rule the checkout follows
export function PayoutStatus({ merchant }: { merchant: MerchantView }) {
  if (merchant.state === "rejected") {
    return (
      <Panel
        icon={<XCircle className="size-5 text-destructive" />}
        tone="destructive"
        title="Your payout account wasn't approved"
        body={
          merchant.notes ??
          "Pinch couldn't verify the details provided. Check the business name matches the bank account exactly, then get in touch."
        }
        merchant={merchant}
      />
    );
  }

  if (merchant.state === "submitted" || merchant.state === "in-review") {
    return (
      <Panel
        icon={<Clock className="size-5 text-muted-foreground" />}
        tone="muted"
        title={merchant.state === "in-review" ? "Being reviewed" : "Details received"}
        body="Your listings stay up while this is checked. You'll be able to take payments as soon as it clears."
        merchant={merchant}
      />
    );
  }

  return (
    <Panel
      icon={<CheckCircle2 className="size-5 text-verified" />}
      tone="verified"
      title="You're set up to be paid"
      body="Money from your listings settles straight to this account. UniTrade never holds it."
      merchant={merchant}
    />
  );
}

function Panel({
  icon,
  tone,
  title,
  body,
  merchant,
}: {
  icon: React.ReactNode;
  tone: "verified" | "muted" | "destructive";
  title: string;
  body: string;
  merchant: MerchantView;
}) {
  const border =
    tone === "verified" ? "border-verified/30 bg-verified/5" : tone === "destructive" ? "border-destructive/30 bg-destructive/5" : "bg-muted/40";

  return (
    <div className="space-y-4">
      <div className={`flex gap-3 rounded-xl border p-4 ${border}`}>
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div>
          <h2 className="font-heading font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>

      <dl className="rounded-xl border bg-muted/40 p-4 text-sm">
        <Row label="Business">{merchant.companyName ?? "—"}</Row>
        <Row label="Paid into">
          {merchant.bankAccountTail ? (
            <span className="flex items-center gap-1.5">
              <Landmark className="size-3.5 text-muted-foreground" />
              account ending {merchant.bankAccountTail}
            </span>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Merchant ID">
          <code className="rounded bg-background px-1.5 py-0.5 text-xs">{merchant.merchantId ?? "—"}</code>
        </Row>
        <Row label="Settlements">
          <Badge variant={merchant.settlementsEnabled ? "secondary" : "outline"}>
            {merchant.settlementsEnabled ? "Enabled" : "Pending"}
          </Badge>
        </Row>
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b py-2 last:border-0">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium">{children}</dd>
    </div>
  );
}
