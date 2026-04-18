import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    events: i.entity({
      externalId: i.string().unique().indexed(),
      sourcePlatform: i.string().indexed(),
      title: i.string(),
      description: i.string().optional(),
      rawPostText: i.string(),
      sourceUrl: i.string().optional(),
      venueName: i.string().optional(),
      address: i.string().optional(),
      latitude: i.number().optional(),
      longitude: i.number().optional(),
      startsAt: i.number().optional(),
      endsAt: i.number().optional(),
      imageUrl: i.string().optional(),
      attendanceType: i.string().optional(),
      attendanceHow: i.string().optional(),
      attendanceSummary: i.string().optional(),
      importedAt: i.number(),
      updatedAt: i.number(),
    }),
    chats: i.entity({
      ownerId: i.string().indexed(),
      title: i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    messages: i.entity({
      ownerId: i.string().indexed(),
      chatId: i.string().indexed(),
      role: i.string(),
      content: i.string(),
      createdAt: i.number(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
