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
  <button
    v-if="!isOpen"
    class="btn btn-circle btn-primary btn-lg shadow-lg fixed bottom-5 right-5 z-50 text-2xl"
    @click="isOpen = true"
    aria-label="Open chat"
  >💬</button>

  <div v-if="isOpen" class="card fixed bottom-5 right-5 w-80 h-[440px] shadow-xl flex flex-col overflow-hidden z-50">
    <div class="bg-primary text-primary-content px-4 py-3 flex items-center gap-2 flex-shrink-0">
      <div class="avatar placeholder">
        <div class="bg-primary-content/20 text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">AI</div>
      </div>
      <div class="flex-1">
        <p class="text-sm font-semibold leading-tight">AI Assistant</p>
        <p class="text-xs opacity-70">Ask me anything</p>
      </div>
      <button
        class="btn btn-ghost btn-circle btn-xs text-primary-content/80 hover:bg-primary-content/10"
        @click="isOpen = false"
        aria-label="Close chat"
      >✕</button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 bg-base-200 flex flex-col gap-2" ref="messagesEl">
      <template v-for="(msg, i) in messages" :key="i">
        <div v-if="msg.role === 'user'" class="chat chat-end">
          <div class="chat-bubble chat-bubble-primary text-sm">{{ msg.content }}</div>
        </div>
        <div v-else class="chat chat-start">
          <div class="chat-image avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">AI</div>
          </div>
          <div>
            <div class="chat-bubble bg-base-100 text-base-content text-sm">{{ msg.content }}</div>
            <div v-if="msg.sources?.length" class="flex flex-wrap gap-1 mt-1 px-1">
              <span v-for="(s, j) in msg.sources" :key="j" class="badge badge-ghost badge-xs text-primary">
                {{ s.title }} · {{ s.score.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </template>
      <div v-if="isLoading" class="chat chat-start">
        <div class="chat-bubble bg-base-100 text-base-content/60 text-sm">Thinking…</div>
      </div>
    </div>

    <div class="p-2 bg-base-100 border-t border-base-300 flex gap-2 items-center flex-shrink-0">
      <input
        type="text"
        class="input input-bordered input-sm flex-1 rounded-full focus:outline-none focus:border-primary"
        placeholder="Type your message…"
        v-model="input"
        @keydown.enter="handleSend"
        :disabled="isLoading"
      />
      <button
        class="btn btn-primary btn-sm btn-circle flex-shrink-0"
        @click="handleSend"
        :disabled="isLoading || !input.trim()"
        aria-label="Send"
      >↑</button>
    </div>
  </div>
</template>
