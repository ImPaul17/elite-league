import { createClient } from "@supabase/supabase-js";
import { createInvitationSessionInitializer, getInvitationCallback } from "./invitationSession";
import { createPasswordRecoveryInitializer, createPasswordRecoveryTracker, getPasswordRecoveryCallback } from "./passwordRecovery";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const invitationCallback = getInvitationCallback(typeof window === "undefined" ? null : window.location.href);
const recoveryCallback = getPasswordRecoveryCallback(typeof window === "undefined" ? null : window.location.href);
let recoveryStorage;
try { recoveryStorage = typeof window === "undefined" ? undefined : window.sessionStorage; } catch { /* Storage can be blocked. */ }
const recoveryTracker = createPasswordRecoveryTracker({ storage: recoveryStorage });

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

// Public views must never inherit an administrator's session or broader RLS access.
export const publicSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "elite-league-public" },
    })
  : null;

// Register before React mounts so a fast PKCE callback cannot be missed.
// Do not call async Auth methods from an Auth event callback.
supabase?.auth.onAuthStateChange((event, session) => recoveryTracker.handleAuthEvent(event, session));

export const hasVerifiedPasswordRecovery = (session) => recoveryTracker.isVerifiedFor(session);
export const clearVerifiedPasswordRecovery = () => recoveryTracker.clear();

export const initializePasswordRecoverySession = createPasswordRecoveryInitializer(supabase ? recoveryCallback : null, {
  tracker: recoveryTracker,
  initializeAuth: () => supabase.auth.initialize(),
  getSession: () => supabase.auth.getSession(),
  clearUrl() {
    const cleanUrl = new URL(window.location.href);
    for (const name of ["setup", "code", "sb_flow_id", "error", "error_code", "error_description"]) cleanUrl.searchParams.delete(name);
    cleanUrl.hash = "/";
    window.history.replaceState(window.history.state, "", cleanUrl.toString());
  },
});

export const initializeInvitationSession = createInvitationSessionInitializer(supabase ? invitationCallback : null, {
  setSession: (tokens) => supabase.auth.setSession(tokens),
  clearUrl() {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.hash = "/";
    window.history.replaceState(window.history.state, "", cleanUrl.toString());
  },
});
