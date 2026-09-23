import type { AppProfile } from "./app-profile";

export type ConnectConfig = {
  baseUrl: string;
  verifiedAt: string;
  clientName?: string;
  clientLogo?: string;
  clientHero?: string;
  clientTagline?: string;
  planKey?: string;
  appProfile?: AppProfile;
};

export type AppUser = {
  id: number;
  email: string;
  username: string;
  display_name: string;
  first_name?: string;
  roles: string[];
  role_primary: string;
  access_flags: string[];
  modules?: Record<string, boolean>;
  plan_key?: string;
  app_profile?: AppProfile | string;
  active: boolean;
  blog_id: number;
  client_name?: string;
  client_tagline?: string;
  client_logo?: string;
  client_hero?: string;
};

export type MenuItem = {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
  group: "account" | "staff" | string;
  requires?: string[];
};

export type NavigationResponse = {
  role_primary: string;
  roles: string[];
  menus: MenuItem[];
  modules?: Record<string, boolean>;
  plan_key?: string;
  app_profile?: AppProfile | string;
  /** Host WAF blocked Vercel → WordPress; client should load menus instead. */
  upstream_blocked?: boolean;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AppUser;
};

export type Profile = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  ceo_email: string;
  salutation: string;
  contact_type: string;
  company: string;
  job_title: string;
  website: string;
  phone: string;
  mobile: string;
  company_phone?: string;
  coi_expiration?: string;
  payment_terms?: string;
  allergies: string;
  emergency_contact: string;
  opt_email: boolean;
  opt_sms: boolean;
  birthday: string;
  contact_status: string;
  membership_type: string;
  membership_id: string;
  avatar: string;
  unit?: string;
  address?: string;
  editable_fields: string[];
};

export type ReservationItem = {
  id: number;
  resource_name: string;
  start: string;
  end: string;
  status: string;
  details: string;
  expected: number;
};
