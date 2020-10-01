import { Injectable } from '@angular/core';

declare function gtag(...args: any): void;

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private static isOffline = false;

    public static initialize() {
        navigator['connection']?.addEventListener('change', AnalyticsService.updateConnectionStatus);
    }

    public static event(action: string, category?: string, label?: string, value?: number): void {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }

    private static updateConnectionStatus(): void {
        const isOffline = !navigator['connection'].downlink;
        if (AnalyticsService.isOffline && !isOffline) {
            AnalyticsService.event('restored internet connection', 'internet');
        }
        AnalyticsService.isOffline = isOffline;
    }
}
