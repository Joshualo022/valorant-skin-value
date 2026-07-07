import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLoadoutSlots } from "@/lib/loadout";
import { LoadoutGrid } from "./loadout-grid";

export default async function LoadoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const slots = await getLoadoutSlots(user.id);

  return <LoadoutGrid slots={slots} />;
}
