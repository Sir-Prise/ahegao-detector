import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { environment } from 'src/environments/environment';
import { DetectionService } from './services/detection.service';
import { WebcamComponent } from './components/webcam/webcam.component';
import { Box } from './services/detection-response.model';
import { ProgressService } from './services/progress.service';
import { DeviceService } from './services/device.service';
// import * as tmImage from '@teachablemachine/image';
// import * as faceapi from 'face-api.js';
// type faceapi = import('face-api.js');
// import type faceapi from 'face-api.js';
declare var faceapi: any; // TODO Typescript 3.8: Import real type

/**
 * Ideal number of analysis per seconds
 */
const TARGET_FPS = 5;

/**
 * Minimum delay in ms between each analysis to avoid 100% CPU usage on low-end devices
 */
const MINIMUM_DELAY = 75;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    public welcomeScreen = true;
    public isAhegao = false;
    public faceRectangle?: Box;

    public fps = 0;
    public isRunning = true;
    public isPaused = false;

    private camElement?: HTMLVideoElement;

    private readonly assetsUrl = environment.baseHref + '/assets';


    private analysisDurations = [100, 100, 100, 100, 100];

    constructor(
        private readonly detectionService: DetectionService,
        public readonly progressService: ProgressService,
    ) {
    }

    public async ngOnInit() {
    }

    public async ngAfterViewInit(): Promise<void> {
        await this.detectionService.load();

        this.onPause(); ////////////////// TODO: Remove line
        await this.analyze();
    }

    public async onPause(pause = true) {
        this.isRunning = !pause;
        this.progressService.pause(pause);

        if (!pause) {
            await this.analyze();
        }
    }

    public onToggleIsAhegao() {
        this.isAhegao = !this.isAhegao;
        this.progressService.setState(this.isAhegao);
    }

    public camLoaded(event: HTMLVideoElement): void {
        this.camElement = event;
    }

    private async analyze() {
        // Calculate interval
        const averageAnalysisDuration = (this.analysisDurations.reduce((a, b) => a + b, 0) / this.analysisDurations.length) || 0;

        const delay = Math.max((1000 / TARGET_FPS) - averageAnalysisDuration, MINIMUM_DELAY);
        this.fps = 1000 / (averageAnalysisDuration + delay);

        setTimeout(async () => {
            const start = Date.now();

            tf.engine().startScope();
            const result = await this.detectionService.analyse(this.camElement);
            (document.getElementById('output') as HTMLMeterElement).value = result.ahegaoProbability;
            this.faceRectangle = result.face;
            this.isAhegao = result.isAhegao;
            this.progressService.setState(this.isAhegao);
            this.progressService.updateProgress();
            tf.engine().endScope();

            this.analysisDurations.push(Date.now() - start);
            this.analysisDurations.shift();
            console.log(`Analysis took ${Date.now() - start}ms ${new Date().toISOString()}`);

            if (this.isRunning) {
                await this.analyze();
            }
        }, delay);
    }
}
