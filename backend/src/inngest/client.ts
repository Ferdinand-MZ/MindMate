import { Inngest } from "inngest";
import { env } from "../config/env";

// Initialize the Inngest client. The event key now comes from the
// environment (INNGEST_EVENT_KEY) instead of being a literal secret
// checked into source : rotate the key in the Inngest dashboard if this
// codebase was ever public with the old hardcoded value.
export const inngest = new Inngest({
  id: "ai-therapy-agent",
  eventKey: env.inngestEventKey,
});

// Export the functions array (this will be populated by the functions.ts file)
export const functions: any[] = [];
