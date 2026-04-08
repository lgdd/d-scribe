import { ErrorHandler, Injectable } from '@angular/core';
import { datadogRum } from '@datadog/browser-rum';

// Pattern: Global error handler with RUM error reporting
// Adapt: register in app.config.ts via { provide: ErrorHandler, useClass: DatadogErrorHandler }

@Injectable()
export class DatadogErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error(error);
    datadogRum.addError(error instanceof Error ? error : new Error(String(error)), {
      source: 'component',
    });
  }
}
