import { useState, useRef, useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import './ChatWidget.css';

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
    return <button className="chat-fab" onClick={() => setIsOpen(true)} aria-label="Open chat">💬</button>;
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-avatar">🤖</div>
        <div className="chat-header-info">
          <h3>AI Assistant</h3>
          <p>Ask me anything</p>
        </div>
        <button className="chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">✕</button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="chat-msg-user">{msg.content}</div>
          ) : (
            <div key={i} className="chat-msg-assistant">
              <div className="chat-msg-avatar">AI</div>
              <div>
                <div className="chat-msg-content">{msg.content}</div>
                {msg.sources && (
                  <div className="chat-msg-sources">
                    {msg.sources.map((s, j) => (
                      <span key={j} className="chat-source-pill">{s.title} · {s.score.toFixed(2)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {isLoading && <div className="chat-msg-loading">Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-bar">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button className="chat-send" onClick={handleSend} disabled={isLoading || !input.trim()} aria-label="Send">↑</button>
      </div>
    </div>
  );
}
