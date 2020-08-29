import { Injectable } from '@angular/core';
import { DetectionService } from './detection.service';
import { Box, DetectionResponseModel } from './detection-response.model';
import * as tf from '@tensorflow/tfjs';
import { ProgressService } from './progress.service';
import { Subject } from 'rxjs';

/**
 * Ideal number of analysis per seconds
 */
const TARGET_FPS = 5;

/**
 * Display a warning if FPS is lower than this
 */
const MINIMUM_FPS = 1;

/**
 * Minimum delay in ms between each analysis to avoid 100% CPU usage on low-end devices
 */
const MINIMUM_DELAY = 75;

@Injectable({
    providedIn: 'root'
})
export class DetectionLoopService {
    public isAhegao$ = new Subject<boolean>();
    public isRunning = true;
    public isSlow = false;
    public isLoading = true;

    /**
     * Says if no face was detected for a while. Switches to low FPS mode.
     */
    public get isNoFaceDetected(): boolean {
        return this.timeSinceLastFace > 5000;
    }

    public isComparing = false;
    public detection = new Subject<DetectionResponseModel>();

    private camElement: HTMLVideoElement;
    private analysisDurations = [100, 100, 100, 100, 100]; // init with default values
    private timeSinceLastFace = 0;

    constructor(
        private readonly detectionService: DetectionService,
        private readonly progressService: ProgressService,
    ) {
    }

    public start(camElement: HTMLVideoElement): void {
        this.camElement = camElement;
        this.isRunning = true;
        this.progressService.pause(false);
        this.loop();
    }

    public pause(): void {
        this.isRunning = false;
        this.progressService.pause(true);
    }

    private async loop(): Promise<void> {
        // Calculate interval
        const averageAnalysisDuration = (this.analysisDurations.reduce((a, b) => a + b, 0) / this.analysisDurations.length) || 0;

        let delay = Math.max((1000 / TARGET_FPS) - averageAnalysisDuration, MINIMUM_DELAY);

        // FPS
        const fps = 1000 / (averageAnalysisDuration + delay);
        if (fps < MINIMUM_FPS) {
            this.isSlow = true;
        } else {
            this.isSlow = false;
        }

        // Power safe mode if there was no face visible for a while
        if (this.timeSinceLastFace > 20000) {
            delay += 5000;
        } else if (this.timeSinceLastFace > 10000) {
            delay += 1000;
        }

        setTimeout(async () => {
            if (!this.isRunning) {
                return;
            }

            const start = Date.now();

            tf.engine().startScope();
            const result = await this.detectionService.analyse(this.camElement);
            tf.engine().endScope();

            if (!this.isRunning) {
                // Check again in case it got paused during analysis
                return;
            }

            this.detection.next(result);
            this.isAhegao$.next(result.isAhegao);
            this.progressService.setState(result.isAhegao);
            this.progressService.updateProgress();
            if (result.ahegaoProbabilityCompare !== undefined) {
                this.isComparing = true;
            }

            const analysisDuration = Date.now() - start;
            this.analysisDurations.push();
            this.analysisDurations.shift();
            console.log(`Propability: ${Math.round(result.ahegaoProbability * 100).toString().padStart(2, ' ')}% in ${analysisDuration}ms`);

            if (!result.face) {
                this.timeSinceLastFace += delay + analysisDuration;
            } else {
                this.timeSinceLastFace = 0;
            }

            this.isLoading = false;

            await this.loop();
        }, delay);
    }
}
