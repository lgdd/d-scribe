<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { datadogRum } from '@datadog/browser-rum';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Source { title: string; score: number }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[] }

const isOpen = ref(false);
const messages = ref<Message[]>([]);
const input = ref('');
const isLoading = ref(false);
const messagesEl = ref<HTMLDivElement>();

function scrollToBottom() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight; });
}

async function handleSend() {
  const text = input.value.trim();
  if (!text || isLoading.value) return;
  input.value = '';
  messages.value.push({ role: 'user', content: text });
  isLoading.value = true;
  scrollToBottom();

  datadogRum.addAction('chat_message_sent', { messageLength: text.length, historyLength: messages.value.length });

  try {
    const history = messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    messages.value.push({ role: 'assistant', content: data.response, sources: data.sources });
  } catch (err: any) {
    datadogRum.addError(err, { source: 'chat', endpoint: '/api/chat' });
    messages.value.push({ role: 'assistant', content: 'Sorry, something went wrong.' });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}
</script>

<template>
  <button v-if="!isOpen" class="chat-fab" @click="isOpen = true" aria-label="Open chat">💬</button>

  <div v-if="isOpen" class="chat-panel">
    <div class="chat-header">
      <div class="chat-header-avatar">🤖</div>
      <div class="chat-header-info">
        <h3>AI Assistant</h3>
        <p>Ask me anything</p>
      </div>
      <button class="chat-close" @click="isOpen = false" aria-label="Close chat">✕</button>
    </div>
    <div class="chat-messages" ref="messagesEl">
      <template v-for="(msg, i) in messages" :key="i">
        <div v-if="msg.role === 'user'" class="chat-msg-user">{{ msg.content }}</div>
        <div v-else class="chat-msg-assistant">
          <div class="chat-msg-avatar">AI</div>
          <div>
            <div class="chat-msg-content">{{ msg.content }}</div>
            <div v-if="msg.sources?.length" class="chat-msg-sources">
              <span v-for="(s, j) in msg.sources" :key="j" class="chat-source-pill">{{ s.title }} · {{ s.score.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </template>
      <div v-if="isLoading" class="chat-msg-loading">Thinking...</div>
    </div>
    <div class="chat-input-bar">
      <input
        type="text"
        placeholder="Type your message..."
        v-model="input"
        @keydown.enter="handleSend"
        :disabled="isLoading"
      />
      <button class="chat-send" @click="handleSend" :disabled="isLoading || !input.trim()" aria-label="Send">↑</button>
    </div>
  </div>
</template>

<style scoped>
.chat-fab { position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; background: #632ca6; border: none; border-radius: 50%; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(99,44,166,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
.chat-fab:hover { transform: scale(1.1); background: #4a1f80; }
.chat-panel { position: fixed; bottom: 20px; right: 20px; width: 380px; height: 440px; background: #fff; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.15); z-index: 9999; display: flex; flex-direction: column; overflow: hidden; animation: chatSlideUp 0.2s ease-out; }
@keyframes chatSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.chat-header { background: #632ca6; padding: 14px 18px; display: flex; align-items: center; gap: 10px; color: white; }
.chat-header-avatar { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.chat-header-info { flex: 1; }
.chat-header-info h3 { margin: 0; font-size: 14px; font-weight: 600; }
.chat-header-info p { margin: 0; font-size: 11px; opacity: 0.8; }
.chat-close { background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
.chat-close:hover { background: rgba(255,255,255,0.2); }
.chat-messages { flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f5f5f5; }
.chat-msg-user { align-self: flex-end; background: #632ca6; color: white; padding: 10px 14px; border-radius: 14px 14px 4px 14px; max-width: 75%; font-size: 13px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.chat-msg-assistant { align-self: flex-start; display: flex; gap: 8px; max-width: 85%; }
.chat-msg-avatar { width: 26px; height: 26px; background: #632ca6; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; margin-top: 2px; }
.chat-msg-content { background: white; padding: 10px 14px; border-radius: 4px 14px 14px 14px; font-size: 13px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); line-height: 1.5; color: #333; }
.chat-msg-sources { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.chat-source-pill { background: #ede7f6; color: #632ca6; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
.chat-msg-loading { align-self: flex-start; color: #888; font-size: 13px; padding: 4px 0; }
.chat-input-bar { padding: 12px 14px; background: white; border-top: 1px solid #eee; display: flex; gap: 8px; align-items: center; }
.chat-input-bar input { flex: 1; border: 1px solid #ddd; border-radius: 24px; padding: 10px 16px; font-size: 13px; outline: none; background: #f9f9f9; font-family: system-ui, sans-serif; }
.chat-input-bar input:focus { border-color: #632ca6; }
.chat-send { width: 36px; height: 36px; background: #632ca6; border: none; border-radius: 50%; color: white; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(99,44,166,0.3); padding: 0; }
.chat-send:hover { background: #4a1f80; }
.chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
