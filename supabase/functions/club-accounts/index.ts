import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";
import { createAccountHandler } from "./handler.js";

Deno.serve(createAccountHandler({ createClient, getEnv: (key: string) => Deno.env.get(key) }));
