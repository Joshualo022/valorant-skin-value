import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";
import { DisplayNameForm } from "./display-name-form";
import { GoogleLinkSection } from "./google-link-section";
import { AvatarPicker } from "./avatar-picker";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const reviewCount = await prisma.review.count({ where: { userId: user.id } });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Profile</h2>
        <DisplayNameForm initialDisplayName={resolveDisplayName(user)} />
        <p className="text-sm text-zinc-400">
          {reviewCount} review{reviewCount === 1 ? "" : "s"} written
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Avatar</h2>
        <AvatarPicker displayName={resolveDisplayName(user)} initialAvatarId={user.avatarId} />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Connected accounts
        </h2>
        <GoogleLinkSection />
      </section>
    </div>
  );
}
