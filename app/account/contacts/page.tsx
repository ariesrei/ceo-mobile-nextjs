import { StaffModulePlaceholder } from "@/components/StaffModulePlaceholder";

export default function ContactsPage() {
  return (
    <StaffModulePlaceholder
      path="/account/contacts"
      title="Contacts"
      subtitle="Residents and staff"
      description="The contacts directory is not in the mobile API yet. This screen will list the same people as desktop All Contacts."
    />
  );
}
