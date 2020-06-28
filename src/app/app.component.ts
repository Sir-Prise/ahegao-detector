import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { environment } from 'src/environments/environment';
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
    public isAhegao = false;

    public readonly faceCanvasSize = 75;

    public fps = 0;

    @ViewChild('cam')
    private cam: ElementRef<HTMLVideoElement>;

    @ViewChild('outputVideoWrapper')
    private outputVideoWrapper: ElementRef<HTMLDivElement>;

    private readonly assetsUrl = environment.baseHref + '/assets';

    private isRunning = true;

    private faceCanvas: HTMLCanvasElement;
    private faceCanvasContext: CanvasRenderingContext2D;

    private faceapiOptions: any; // faceapi.TinyFaceDetectorOptions;
    private ahegaoModel: tf.LayersModel; // tmImage.CustomMobileNet;

    private analysisDurations = [100, 100, 100, 100, 100];

    public async ngOnInit() {
        this.faceCanvas = document.getElementById('face') as HTMLCanvasElement;
        // this.faceCanvas = document.createElement('canvas');
        this.faceCanvasContext = this.faceCanvas.getContext('2d');
    }

    public async ngAfterViewInit(): Promise<void> {
        // init detection options
        this.faceapiOptions = new faceapi.TinyFaceDetectorOptions({inputSize: 224, scoreThreshold: 0.5});

        const loadNet = async () => {
            const detectionNet = faceapi.nets.tinyFaceDetector;
            await detectionNet.load(this.assetsUrl + '/model-face');
            await faceapi.loadTinyFaceDetectorModel(this.assetsUrl + '/model-face');
            return detectionNet;
        };

        await this.initCamera();

        await loadNet();
        await this.loadAhegaoNet();

        await this.analyze();
    }

    private async initCamera(): Promise<void> {
        this.cam.nativeElement.srcObject = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: 'user',
                height: { ideal: 2160 } // Get highest possible resolution
            }
        });
        return new Promise((resolve) => {
            this.cam.nativeElement.onloadedmetadata = () => {
                this.updateOutputVideoSize();
                resolve();
            };
        });
    }

    private updateOutputVideoSize(): void {
        const width = this.outputVideoWrapper.nativeElement.clientWidth;
        const height = width / (this.cam.nativeElement.videoWidth / this.cam.nativeElement.videoHeight);
        this.cam.nativeElement.width = width;
        this.cam.nativeElement.height = height;
        this.outputVideoWrapper.nativeElement.style.height = `${height}px`;
    }

    public async onToggle() {
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            await this.analyze();
        }
    }
    private async analyze() {
        // Calculate interval
        const averageAnalysisDuration = (this.analysisDurations.reduce((a, b) => a + b, 0) / this.analysisDurations.length) || 0;

        const delay = Math.max((1000 / TARGET_FPS) - averageAnalysisDuration, MINIMUM_DELAY);
        this.fps = 1000 / (averageAnalysisDuration + delay);

        setTimeout(async () => {
            const start = Date.now();

            tf.engine().startScope();
            await this.extractFace();
            await this.getAhegao();
            tf.engine().endScope();

            this.analysisDurations.push(Date.now() - start);
            this.analysisDurations.shift();
            console.log(`Analysis took ${Date.now() - start}ms ${new Date().toISOString()}`);

            if (this.isRunning) {
                await this.analyze();
            }
        }, delay);
    }

    private async loadAhegaoNet(): Promise<void> {
        // this.ahegaoModel = await tmImage.load(this.assetsUrl + '/model-ag/model.json', this.assetsUrl + '/model-ag/metadata.json');
        this.ahegaoModel = await tf.loadLayersModel(this.assetsUrl + '/model-ag/model.json');
    }

    private async extractFace(): Promise<{size: number} | undefined> {
        const result = await faceapi.detectSingleFace(this.cam.nativeElement, this.faceapiOptions);
        if (result) {
            const box = result.box.toSquare();
            this.faceCanvasContext.drawImage(
                this.cam.nativeElement,
                box.x, box.y, box.width, box.height,
                0, 0, this.faceCanvasSize, this.faceCanvasSize
            );
            return {size: box.width};
        }
    }

    private async getAhegao() {
        const tensor = tf.browser.fromPixels(this.faceCanvas);
        const convertedTensor = tensor.expandDims(0).toFloat().div(255);
        const result = await this.ahegaoModel.predict(convertedTensor) as tf.Tensor;
        const probability = result.dataSync()[0];
        // const probability = result[0];
        convertedTensor.dispose();
        (document.getElementById('output') as HTMLMeterElement).value = probability;

        this.isAhegao = probability > 0.6;
    }
}
