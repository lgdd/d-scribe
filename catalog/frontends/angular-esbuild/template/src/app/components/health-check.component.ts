import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-health-check',
  standalone: true,
  template: `
    <div>
      <h1>Demo Application</h1>
      <p>API status: <strong>{{ status }}</strong></p>
    </div>
  `,
})
export class HealthCheckComponent implements OnInit {
  status = 'checking...';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ status: string }>(`${environment.apiUrl}/health`).subscribe({
      next: (data) => (this.status = data.status || 'ok'),
      error: () => (this.status = 'unreachable'),
    });
  }
}
