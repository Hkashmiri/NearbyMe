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
  chats: {
    bind: ["isOwner", "auth.id != null && auth.id == data.ownerId"],
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
  },
  messages: {
    bind: ["isOwner", "auth.id != null && auth.id == data.ownerId"],
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
  },
} satisfies InstantRules;

export default rules;
