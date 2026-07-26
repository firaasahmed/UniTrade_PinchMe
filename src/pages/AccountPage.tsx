import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/session/SessionContext";
import { RequireAuth } from "@/ui/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2 } from "lucide-react";

export function AccountPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { state, updateUser } = useSession();
  const user = state.status === "signedIn" ? state.user : null;

  const [name, setName] = useState(user?.name ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const dirty = name.trim() !== user.name || location.trim() !== user.location;

  async function save() {
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    setBusy(true);
    try {
      await updateUser({ name: name.trim(), location: location.trim() });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "couldn't save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">Account settings</h1>

      <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Suburb, State"
          />
        </div>

        <div className="grid gap-2">
          <Label>University email</Label>
          <div className="flex items-center gap-2">
            <Input value={user.email} readOnly disabled className="opacity-70" />
            {user.verified && (
              <Badge variant="secondary" className="shrink-0 gap-1 border-transparent bg-verified/12 text-verified">
                <ShieldCheck className="size-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Your email and university are your verification anchor and can't be changed here.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>University</Label>
          <Input value={user.university} readOnly disabled className="opacity-70" />
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <Button asChild variant="ghost">
            <Link to={`/profile/${user.id}`}>View public profile</Link>
          </Button>
          <Button onClick={() => void save()} disabled={busy || !dirty}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
