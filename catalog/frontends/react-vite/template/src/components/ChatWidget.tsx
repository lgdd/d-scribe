import { useState, useRef, useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Source { title: string; score: number }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[] }

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    datadogRum.addAction('chat_message_sent', { messageLength: text.length, historyLength: messages.length });

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, sources: data.sources }]);
    } catch (err: any) {
      datadogRum.addError(err, { source: 'chat', endpoint: '/api/chat' });
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        className="btn btn-circle btn-primary btn-lg shadow-lg fixed bottom-5 right-5 z-50 text-2xl"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >💬</button>
    );
  }

  return (
    <div className="card fixed bottom-5 right-5 w-80 h-[440px] shadow-xl flex flex-col overflow-hidden z-50">
      <div className="bg-primary text-primary-content px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="avatar placeholder">
          <div className="bg-primary-content/20 text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">AI</div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">AI Assistant</p>
          <p className="text-xs opacity-70">Ask me anything</p>
        </div>
        <button
          className="btn btn-ghost btn-circle btn-xs text-primary-content/80 hover:bg-primary-content/10"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
        >✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 bg-base-200 flex flex-col gap-2">
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="chat chat-end">
              <div className="chat-bubble chat-bubble-primary text-sm">{msg.content}</div>
            </div>
          ) : (
            <div key={i} className="chat chat-start">
              <div className="chat-image avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">AI</div>
              </div>
              <div>
                <div className="chat-bubble bg-base-100 text-base-content text-sm">{msg.content}</div>
                {msg.sources && (
                  <div className="flex flex-wrap gap-1 mt-1 px-1">
                    {msg.sources.map((s, j) => (
                      <span key={j} className="badge badge-ghost badge-xs text-primary">{s.title} · {s.score.toFixed(2)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {isLoading && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-100 text-base-content/60 text-sm">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 bg-base-100 border-t border-base-300 flex gap-2 items-center flex-shrink-0">
        <input
          type="text"
          className="input input-bordered input-sm flex-1 rounded-full focus:outline-none focus:border-primary"
          placeholder="Type your message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button
          className="btn btn-primary btn-sm btn-circle flex-shrink-0"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Send"
        >↑</button>
      </div>
    </div>
  );
}
