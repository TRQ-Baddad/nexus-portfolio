// This file provides type definitions for Vite's `import.meta.env` feature.
// It ensures that TypeScript understands the environment variables you're using.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string; // Client-safe key for Live API ONLY, must be restricted
  readonly VITE_MORALIS_API_KEY?: string;
  readonly VITE_HELIUS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
