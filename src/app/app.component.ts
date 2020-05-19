import { Component, OnInit } from '@angular/core';
import * as tmImage from '@teachablemachine/image';
import { environment } from 'src/environments/environment';
// import * as faceapi from 'face-api.js';
// type faceapi = import('face-api.js');
declare var faceapi: any; // TODO Typescript 3.8: Import real type

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public isAhegao = false;

    private readonly assetsUrl = environment.baseHref + '/assets';

    private isRunning = false;

    private cam: HTMLVideoElement;
    private currentFrameCanvas: HTMLCanvasElement;
    private currentFrameContext: CanvasRenderingContext2D;
    private faceCanvas: HTMLCanvasElement;
    private faceCanvasContext: CanvasRenderingContext2D;

    private faceapiOptions: any; // faceapi.TinyFaceDetectorOptions;
    private ahegaoModel: tmImage.CustomMobileNet;

    public async ngOnInit() {
        this.cam = document.getElementById('cam') as HTMLVideoElement;
        this.currentFrameCanvas = document.getElementById('current-frame') as HTMLCanvasElement;
        this.currentFrameContext = this.currentFrameCanvas.getContext('2d');
        this.faceCanvas = document.getElementById('face') as HTMLCanvasElement;
        this.faceCanvasContext = this.faceCanvas.getContext('2d');

        // init detection options
        this.faceapiOptions = new faceapi.TinyFaceDetectorOptions({scoreThreshold: 0.5});

        const loadNet = async () => {
            const detectionNet = faceapi.nets.tinyFaceDetector;
            await detectionNet.load(this.assetsUrl + '/model-face');
            await faceapi.loadTinyFaceDetectorModel(this.assetsUrl + '/model-face');
            return detectionNet;
        };

        const initCamera = async (width, height) => {
            this.cam.width = width;
            this.cam.height = height;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: 'user',
                    width: width,
                    height: height
                }
            });
            this.cam.srcObject = stream;
            return new Promise((resolve) => {
                this.cam.onloadedmetadata = () => {
                    resolve(this.cam);
                };
            });
        };

        await loadNet();
        await initCamera(720, 560);
        await this.loadAhegaoNet();

        await this.analyze();
    }

    public async onToggle() {
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            await this.analyze();
        }
    }

    private async analyze() {
        const start = Date.now();
        await this.detectFace();
        const faceTime = Date.now() - start;
        await this.getAhegao();
        const ahegaoTime = Date.now() - start;
        console.log(`Face: ${faceTime}ms; Ahegao: ${ahegaoTime}; Now: ${Date.now()}`);

        if (this.isRunning) {
            await this.analyze();
        }
    }

    private async loadAhegaoNet(): Promise<void> {
        this.ahegaoModel = await tmImage.load(this.assetsUrl + '/model-ag/model.json', this.assetsUrl + '/model-ag/metadata.json');
    }

    private async detectFace() {
        this.currentFrameContext.drawImage(this.cam, 0, 0);
        const result = await faceapi.detectSingleFace(this.currentFrameCanvas, this.faceapiOptions);
        if (result) {
            const box = result.box.toSquare();
            const faceImageData = this.currentFrameContext.getImageData(box.x, box.y, box.width, box.height);
            // const scale = box.width / 200;
            // this.faceCanvasContext.scale(scale, scale);
            this.faceCanvas.width = box.width;
            this.faceCanvas.height = box.height;
            this.faceCanvasContext.putImageData(faceImageData, 0, 0);
        }
    }

    private async getAhegao() {
        const result = await this.ahegaoModel.predict(this.faceCanvas);
        const probability = result[0].probability;
        (document.getElementById('output') as HTMLMeterElement).value = probability;

        this.isAhegao = probability > 0.6;
    }
}
