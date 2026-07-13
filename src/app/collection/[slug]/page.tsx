import { redirect } from "next/navigation";

// /u/:slug is now the single canonical profile URL — this route only exists
// so old share links (already handed out before this redirect existed) keep
// working.
export default async function CollectionSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/u/${slug}`);
}
