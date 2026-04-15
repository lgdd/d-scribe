import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
      <div class="stat bg-base-100 rounded-box border border-base-300 shadow-sm">
        <div class="stat-title">API Status</div>
        <div class="stat-value text-base mt-1">
          <span class="badge" [class]="badgeClass">{{ status }}</span>
        </div>
        <div class="stat-desc">Endpoint: {{ apiUrl }}/health</div>
      </div>
    </div>
  `,
})
export class HealthCheckComponent implements OnInit {
  status = 'checking...';
  apiUrl = environment.apiUrl;

  get badgeClass(): string {
    if (this.status === 'ok') return 'badge-success';
    if (this.status === 'checking...') return 'badge-ghost';
    return 'badge-error';
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ status: string }>(`${this.apiUrl}/health`).subscribe({
      next: (data) => (this.status = data.status || 'ok'),
      error: () => (this.status = 'unreachable'),
    });
  }
}
