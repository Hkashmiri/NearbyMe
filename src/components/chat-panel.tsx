"use client";

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: number;
};

type ChatPanelProps = {
  chatTitle: string | null;
  messages: Message[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
};

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ChatPanel({
  chatTitle,
  messages,
  draft,
  onDraftChange,
  onSubmit,
}: ChatPanelProps) {
  return (
    <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">
          {chatTitle ?? "Select a chat"}
        </h2>
        <p className="text-sm text-slate-400">
          Save prompts, event ideas, and notes in realtime.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[90%] rounded-[22px] px-4 py-3 ${
              message.role === "assistant"
                ? "bg-amber-200/10 text-slate-100"
                : "self-end bg-white/8 text-white"
            }`}
          >
            <p className="text-sm leading-6">{message.content}</p>
            <p className="mt-2 text-xs text-slate-400">
              {formatTimestamp(message.createdAt)}
            </p>
          </div>
        ))}
        {!messages.length ? (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/4 p-5 text-sm text-slate-400">
            This chat is empty. Add your first note or prompt below.
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={3}
            placeholder="Save a prompt, event shortlist, or note..."
            className="min-h-[88px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="self-end rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
