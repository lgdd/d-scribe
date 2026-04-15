import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { datadogRum } from '@datadog/browser-rum';
import { environment } from '../../environments/environment';

interface Source { title: string; score: number; }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[]; }

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button
      *ngIf="!isOpen"
      class="btn btn-circle btn-primary btn-lg shadow-lg fixed bottom-5 right-5 z-50 text-2xl"
      (click)="isOpen = true"
      aria-label="Open chat"
    >💬</button>

    <div *ngIf="isOpen" class="card fixed bottom-5 right-5 w-80 h-[440px] shadow-xl flex flex-col overflow-hidden z-50">
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
          (click)="isOpen = false"
          aria-label="Close chat"
        >✕</button>
      </div>

      <div class="flex-1 overflow-y-auto p-3 bg-base-200 flex flex-col gap-2" #messagesEl>
        <ng-container *ngFor="let msg of messages">
          <div *ngIf="msg.role === 'user'" class="chat chat-end">
            <div class="chat-bubble chat-bubble-primary text-sm">{{ msg.content }}</div>
          </div>
          <div *ngIf="msg.role === 'assistant'" class="chat chat-start">
            <div class="chat-image avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">AI</div>
            </div>
            <div>
              <div class="chat-bubble bg-base-100 text-base-content text-sm">{{ msg.content }}</div>
              <div *ngIf="msg.sources?.length" class="flex flex-wrap gap-1 mt-1 px-1">
                <span *ngFor="let s of msg.sources" class="badge badge-ghost badge-xs text-primary">
                  {{ s.title }} · {{ s.score.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </ng-container>
        <div *ngIf="isLoading" class="chat chat-start">
          <div class="chat-bubble bg-base-100 text-base-content/60 text-sm">Thinking…</div>
        </div>
      </div>

      <div class="p-2 bg-base-100 border-t border-base-300 flex gap-2 items-center flex-shrink-0">
        <input
          type="text"
          class="input input-bordered input-sm flex-1 rounded-full focus:outline-none focus:border-primary"
          placeholder="Type your message…"
          [(ngModel)]="input"
          (keydown.enter)="handleSend()"
          [disabled]="isLoading"
        />
        <button
          class="btn btn-primary btn-sm btn-circle flex-shrink-0"
          (click)="handleSend()"
          [disabled]="isLoading || !input.trim()"
          aria-label="Send"
        >↑</button>
      </div>
    </div>
  `,
})
export class ChatWidgetComponent {
  isOpen = false;
  messages: Message[] = [];
  input = '';
  isLoading = false;

  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLDivElement>;

  constructor(private http: HttpClient) {}

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesEl) {
        this.messagesEl.nativeElement.scrollTop = this.messagesEl.nativeElement.scrollHeight;
      }
    }, 0);
  }

  handleSend(): void {
    const text = this.input.trim();
    if (!text || this.isLoading) return;
    this.input = '';
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.isLoading = true;

    datadogRum.addAction('chat_message_sent', { messageLength: text.length, historyLength: this.messages.length });

    const history = this.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    this.http.post<{ response: string; sources: Source[] }>(`${environment.apiUrl}/api/chat`, { message: text, history })
      .subscribe({
        next: (data) => {
          this.messages = [...this.messages, { role: 'assistant', content: data.response, sources: data.sources }];
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: (err) => {
          datadogRum.addError(err, { source: 'chat', endpoint: '/api/chat' });
          this.messages = [...this.messages, { role: 'assistant', content: 'Sorry, something went wrong.' }];
          this.isLoading = false;
          this.scrollToBottom();
        },
      });
  }
}
