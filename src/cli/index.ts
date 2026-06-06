#!/usr/bin/env node

// Entry point. Zero logic — boots the app and restores the cursor on crash.

import pc from "picocolors";
import { run } from "./app.ts";
import { show } from "./ui/terminal.ts";

run().catch((err) => {
  show();
  console.error(pc.red("Unexpected error:"), err);
  process.exit(1);
});
