import { createClient } from "@supabase/supabase-js";
import { createInvitationSessionInitializer, getInvitationCallback } from "./invitationSession";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const invitationCallback = getInvitationCallback(typeof window === "undefined" ? null : window.location.href);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !invitationCallback,
        flowType: "pkce",
      },
    })
  : null;

export const initializeInvitationSession = createInvitationSessionInitializer(supabase ? invitationCallback : null, {
  setSession: (tokens) => supabase.auth.setSession(tokens),
  clearUrl() {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.hash = "/";
    window.history.replaceState(window.history.state, "", cleanUrl.toString());
  },
});
