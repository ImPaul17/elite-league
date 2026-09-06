import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { assertProductionConfiguration } from "./scripts/production-config.mjs";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (command === "build") assertProductionConfiguration(env);
  return {
    plugins: [react()],
    // GitHub Actions injects /<repository>/ for project Pages; local and custom-domain builds use /.
    base: env.VITE_BASE_PATH || "/",
  };
});
