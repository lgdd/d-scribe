import { Injectable } from '@angular/core';
import { datadogRum } from '@datadog/browser-rum';

// Pattern: RUM user identification — track sessions by user
// Adapt: call after your authentication flow resolves

@Injectable({ providedIn: 'root' })
export class UserIdentificationService {
  setUser(userId: string, email: string): void {
    datadogRum.setUser({ id: userId, email, name: email.split('@')[0] });
  }

  clearUser(): void {
    datadogRum.clearUser();
  }
}
