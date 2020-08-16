import { Injectable } from '@angular/core';
import { DetectionService } from './detection.service';
import { Box } from './detection-response.model';
import * as tf from '@tensorflow/tfjs';
import { ProgressService } from './progress.service';

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
    public isAhegao = false;
    public faceRectangle?: Box;
    public isRunning = true;
    public isSlow = false;

    /**
     * Says if no face was detected for a while. Switches to low FPS mode.
     */
    public get isNoFaceDetected(): boolean {
        return this.timeSinceLastFace > 5000;
    }

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

        const delay = Math.max((1000 / TARGET_FPS) - averageAnalysisDuration, MINIMUM_DELAY);

        // FPS
        const fps = 1000 / (averageAnalysisDuration + delay);
        if (fps < MINIMUM_FPS) {
            this.isSlow = true;
        } else {
            this.isSlow = false;
        }

        setTimeout(async () => {
            if (!this.isRunning) {
                return;
            }

            const start = Date.now();

            tf.engine().startScope();
            const result = await this.detectionService.analyse(this.camElement);
            tf.engine().endScope();

            this.faceRectangle = result.face;
            this.isAhegao = result.isAhegao;
            this.progressService.setState(this.isAhegao);
            this.progressService.updateProgress();

            const analysisDuration = Date.now() - start;
            this.analysisDurations.push();
            this.analysisDurations.shift();
            console.log(`Analysis took ${analysisDuration}ms ${new Date().toISOString()}`);

            if (!result.face) {
                this.timeSinceLastFace += delay + analysisDuration;
            } else {
                this.timeSinceLastFace = 0;
            }

            await this.loop();
        }, delay);
    }
}
