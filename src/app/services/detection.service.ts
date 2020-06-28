import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { environment } from 'src/environments/environment';
import { DetectionResponseModel, Box } from './detection-response.model';
declare var faceapi: any;

@Injectable({
    providedIn: 'root'
})
export class DetectionService {

    private readonly assetsUrl = environment.baseHref + '/assets';
    private readonly faceapiOptions = new faceapi.TinyFaceDetectorOptions({inputSize: 224, scoreThreshold: 0.5});
    private readonly faceCanvasSize = 75;
    private readonly ahegaoThreshold = 0.6;

    private faceCanvas: HTMLCanvasElement;
    private faceCanvasContext: CanvasRenderingContext2D;
    private ahegaoModel?: tf.LayersModel;

    constructor() { }

    public async load(): Promise<void> {
        // Initialize variables
        this.faceCanvas = document.createElement('canvas');
        this.faceCanvas.width = this.faceCanvasSize;
        this.faceCanvas.height = this.faceCanvasSize;
        this.faceCanvasContext = this.faceCanvas.getContext('2d');

        // Load ahegao detection
        const ahegaoModelPromise = tf.loadLayersModel(this.assetsUrl + '/model-ag/model.json');

        // Load face detection
        const detectionNet = faceapi.nets.tinyFaceDetector;
        await detectionNet.load(this.assetsUrl + '/model-face');
        await faceapi.loadTinyFaceDetectorModel(this.assetsUrl + '/model-face');

        this.ahegaoModel = await ahegaoModelPromise;
    }

    public async analyse(camElement: HTMLVideoElement): Promise<DetectionResponseModel> {
        if (!this.ahegaoModel) {
            throw new Error('Model not loaded');
        }
        const faceBox = await this.extractFace(camElement);
        if (!faceBox) {
            // no face detected
            return {
                ahegaoProbability: 0,
                isAhegao: false
            };
        }
        const ahegaoProbability = await this.getAhegao();
        return {
            face: faceBox,
            ahegaoProbability,
            isAhegao: ahegaoProbability > this.ahegaoThreshold
        };
    }

    private async extractFace(camElement: HTMLVideoElement): Promise<Box | undefined> {
        const result = await faceapi.detectSingleFace(camElement, this.faceapiOptions);
        if (result) {
            const box = result.box.toSquare();
            this.faceCanvasContext.drawImage(
                camElement,
                box.x, box.y, box.width, box.height,
                0, 0, this.faceCanvasSize, this.faceCanvasSize
            );
            return box;
        }
    }

    private async getAhegao(): Promise<number> {
        const tensor = tf.browser.fromPixels(this.faceCanvas);
        const convertedTensor = tensor.expandDims(0).toFloat().div(255);
        const result = await this.ahegaoModel.predict(convertedTensor) as tf.Tensor;
        const probability = result.dataSync()[0];
        convertedTensor.dispose();

        return probability;
    }
}
