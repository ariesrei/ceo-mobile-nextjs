import { keepWarrantyChrome } from "@/lib/app-profile";
import { redirect } from "next/navigation";

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function EditProfilePage({ searchParams }: Props) {
  const from = (await searchParams)?.from;
  redirect(
    keepWarrantyChrome(from) ? "/account/profile?from=warranty" : "/account/profile"
  );
}
