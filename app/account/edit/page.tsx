import { keepWarrantyChrome } from "@/lib/app-profile";
import { getAccountAppProfile } from "@/lib/server-nav";
import { redirect } from "next/navigation";

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function EditProfilePage({ searchParams }: Props) {
  const session = await getAccountAppProfile();
  const from = (await searchParams)?.from;
  redirect(
    keepWarrantyChrome(from, session)
      ? "/account/profile?from=warranty"
      : "/account/profile"
  );
}
