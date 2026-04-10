import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ChatWidgetComponent } from './components/chat-widget.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ChatWidgetComponent],
  template: `
    <nav>
      <a routerLink="/">Home</a>
    </nav>
    <main>
      <router-outlet></router-outlet>
    </main>
    @if (featureChat) {
      <app-chat-widget></app-chat-widget>
    }
  `,
})
export class AppComponent {
  featureChat = environment.featureChat;
}
