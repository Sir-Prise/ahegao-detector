import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceService } from './device.service';

/* The following constants define how fast the user progresses = how fast the intesity increases.
 * The key of the objects mean the current intesity and the values set how the intesity changes absolutely in one second.
 *
 * Example:
 * {0: 0.05, 0.5: 0.01}
 * While the progress is between 0% and 50%, the progress increases by 5% every second. After that it increases by 1% every second.
 */

const IS_INCREASING_PROGRESS = {
    0: 0.01,
    0.3: 0.02,
    0.7: 0.03
};

const IS_DECREASING_PROGRESS = {
    0: -0.01,
    0.1: -0.003,
    0.3: -0.005,
    0.7: -0.02,
    0.8: -0.03
};

/**
 * Be more generous with switching back to decreasing as time passes.
 */
const TIME_REGARD_DURATION = 60 * 5;
const TIME_REGARD_MAX_MS = 2000;


@Injectable({
    providedIn: 'root'
})
export class ProgressService {

    public intensity$ = new Subject<{intensity: number, baseIntensity: number, activeIntensity: number}>();

    private isIncreasing = false;
    private lastState = false;
    private lastStateChange: number;

    private isPaused = false;

    private lastUpdate: number;
    private lastBaseIntensity = 0;

    private startTime = Date.now();
    private previousTime = 0;

    constructor(
        private readonly deviceService: DeviceService,
    ) {
    }

    public setState(isIncresing: boolean) {
        this.isIncreasing = isIncresing;
    }

    public pause(pause = true): void {
        this.isPaused = pause;

        if (pause) {
            this.previousTime += Date.now() - this.startTime;
            this.deviceService.setIntesity(0);
        } else {
            this.startTime = Date.now();
            this.lastUpdate = undefined;
            this.lastStateChange = undefined;
        }

        this.updateProgress();
    }

    public updateProgress(): void {
        if (this.isPaused) {
            return;
        }

        // Get time since last progress update
        const now = Date.now();
        if (!this.lastUpdate) {
            this.lastUpdate = now;
            return;
        }
        const interval = now - this.lastUpdate;
        this.lastUpdate = now;

        const isIncreasing = this.getStateWithTimeRegard();

        const changePerSecond = ProgressService.getChangeValue(
            isIncreasing ? IS_INCREASING_PROGRESS : IS_DECREASING_PROGRESS,
            this.lastBaseIntensity
        );

        let newBaseIntensity = this.lastBaseIntensity + changePerSecond * (interval / 1000);
        newBaseIntensity = Math.min(Math.max(newBaseIntensity, 0), 1);

        this.lastBaseIntensity = newBaseIntensity;

        // Add intensity if currently active
        const activeIntensity = isIncreasing ? Math.min(0.15, 1 - newBaseIntensity) : 0;
        const newIntensity = newBaseIntensity + activeIntensity;

        // Output
        this.intensity$.next({
            intensity: newIntensity,
            baseIntensity: newBaseIntensity,
            activeIntensity
        });
        this.deviceService.setIntesity(newIntensity);
    }

    /**
     * Checks if the state is increasing. Later in game it's more generous and still returns true when it actually just switched to false.
     */
    private getStateWithTimeRegard(): boolean {
        if (this.isIncreasing !== this.lastState) {
            this.lastState = this.isIncreasing;
            this.lastStateChange = Date.now();
        }
        if (this.isIncreasing) {
            return true;
        }
        if (this.lastStateChange && this.lastStateChange + this.getTimeProgress() * TIME_REGARD_MAX_MS > Date.now()) {
            return true;
        }
        return false;
    }

    private static getChangeValue(settings: {[key: number]: number}, current: number): number {
        let lastValue = 0;
        for (const [key, value] of Object.entries(settings)) {
            if (Number(key) > current) {
                return lastValue;
            }
            lastValue = value;
        }
        return lastValue;
    }

    private getTimeProgress(): number {
        const now = Date.now();
        const elapsedTime = now - this.startTime + this.previousTime;
        return Math.min(elapsedTime / (TIME_REGARD_DURATION * 1000), 1);
    }
}
