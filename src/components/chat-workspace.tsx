"use client";

import { useEffect, useMemo, useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { ChatPanel } from "@/components/chat-panel";
import { ChatSidebar } from "@/components/chat-sidebar";
import { UserMenu } from "@/components/auth-shell";

type ChatRecord = {
  id: string;
  title: string;
  updatedAt: number;
};

type MessageRecord = {
  id: string;
  chatId: string;
  role: string;
  content: string;
  createdAt: number;
};

export function ChatWorkspace({ eventsCount }: { eventsCount: number }) {
  const user = db.useUser();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { data, isLoading, error } = db.useQuery({
    chats: {
      $: {
        where: {
          ownerId: user.id,
        },
      },
    },
    messages: {
      $: {
        where: {
          ownerId: user.id,
        },
      },
    },
  });

  const chats = useMemo(
    () =>
      [...(data?.chats ?? [])].sort(
        (left: ChatRecord, right: ChatRecord) => right.updatedAt - left.updatedAt,
      ),
    [data?.chats],
  );
  const messages = useMemo(
    () =>
      [...(data?.messages ?? [])]
        .filter((message: MessageRecord) => message.chatId === activeChatId)
        .sort((left: MessageRecord, right: MessageRecord) => left.createdAt - right.createdAt),
    [activeChatId, data?.messages],
  );
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0] ?? null;

  useEffect(() => {
    if (!activeChatId && chats[0]) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  const createChat = () => {
    const chatId = id();
    const now = Date.now();
    db.transact(
      db.tx.chats[chatId].update({
        ownerId: user.id,
        title: `New Chat ${new Date(now).toLocaleTimeString()}`,
        createdAt: now,
        updatedAt: now,
      }),
    );
    setActiveChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    const chatMessages = (data?.messages ?? []).filter(
      (message: MessageRecord) => message.chatId === chatId,
    );
    db.transact([
      db.tx.chats[chatId].delete(),
      ...chatMessages.map((message: MessageRecord) => db.tx.messages[message.id].delete()),
    ]);
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const submitMessage = () => {
    if (!draft.trim() || !activeChat) {
      return;
    }

    const now = Date.now();
    db.transact([
      db.tx.messages[id()].update({
        ownerId: user.id,
        chatId: activeChat.id,
        role: "user",
        content: draft.trim(),
        createdAt: now,
      }),
      db.tx.chats[activeChat.id].update({
        updatedAt: now,
        title:
          activeChat.title.startsWith("New Chat") && draft.trim().length
            ? draft.trim().slice(0, 40)
            : activeChat.title,
      }),
    ]);
    setDraft("");
  };

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-400">
        Loading chats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 text-sm text-rose-300">
        {error.message}
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
      <div className="space-y-6">
        <div className="flex justify-end">
          <UserMenu />
        </div>
        <ChatSidebar
          chats={chats}
          activeChatId={activeChat?.id ?? null}
          onSelectChat={setActiveChatId}
          onCreateChat={createChat}
          onDeleteChat={deleteChat}
          eventsCount={eventsCount}
        />
      </div>
      <ChatPanel
        chatTitle={activeChat?.title ?? null}
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={submitMessage}
      />
    </section>
  );
}
