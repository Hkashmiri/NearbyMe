import type { InstantRules } from "@instantdb/react";

const rules = {
  events: {
    allow: {
      view: "true",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
} satisfies InstantRules;

export default rules;
