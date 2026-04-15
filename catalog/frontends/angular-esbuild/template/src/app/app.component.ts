import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ChatWidgetComponent } from './components/chat-widget.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ChatWidgetComponent],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-primary text-primary-content px-4">
        <div class="navbar-start">
          <span class="font-bold tracking-tight">Demo App</span>
        </div>
        <div class="navbar-end">
          <a routerLink="/" class="btn btn-ghost btn-sm text-primary-content">Home</a>
        </div>
      </div>
      <main class="p-6">
        <router-outlet></router-outlet>
      </main>
    </div>
    @if (featureChat) {
      <app-chat-widget></app-chat-widget>
    }
  `,
})
export class AppComponent {
  featureChat = environment.featureChat;
}
