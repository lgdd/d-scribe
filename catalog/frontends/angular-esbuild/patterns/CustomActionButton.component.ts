import { Component, Input } from '@angular/core';
import { datadogRum } from '@datadog/browser-rum';

// Pattern: RUM custom action — track user interactions
// Adapt: use domain-relevant action names and context

@Component({
  selector: 'app-custom-action-button',
  standalone: true,
  template: `<button (click)="handleClick()">{{ label }}</button>`,
})
export class CustomActionButtonComponent {
  @Input() label = '';
  @Input() actionName = '';

  handleClick(): void {
    datadogRum.addAction(this.actionName, { label: this.label, timestamp: Date.now() });
  }
}
