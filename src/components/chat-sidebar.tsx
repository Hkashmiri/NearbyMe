"use client";

import { type EventRecord } from "@/types/events";

type ChatSummary = {
  id: string;
  title: string;
  updatedAt: number;
};

type ChatSidebarProps = {
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  eventsCount: number;
};

function formatUpdatedAt(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  eventsCount,
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full min-h-[60vh] flex-col rounded-[28px] border border-white/10 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          <p className="text-sm text-slate-400">{eventsCount} events in feed</p>
        </div>
        <button
          type="button"
          onClick={onCreateChat}
          className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          New Chat
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`rounded-[22px] border p-4 ${
              activeChatId === chat.id
                ? "border-amber-300/70 bg-amber-200/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectChat(chat.id)}
              className="w-full text-left"
            >
              <p className="text-sm font-semibold text-white">{chat.title}</p>
              <p className="mt-2 text-xs text-slate-400">
                Updated {formatUpdatedAt(chat.updatedAt)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onDeleteChat(chat.id)}
              className="mt-3 text-xs text-rose-300 transition hover:text-rose-200"
            >
              Delete chat
            </button>
          </div>
        ))}
        {!chats.length ? (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/4 p-5 text-sm text-slate-400">
            No chats yet. Create one to save your own event notes and prompts.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
