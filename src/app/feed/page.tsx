import { redirect } from "next/navigation";

// /social is now the canonical destination — this route only exists so old
// links keep working. See SOCIAL_CONSOLIDATION_SPEC.md §1.
export default function FeedRedirect() {
  redirect("/social");
}
