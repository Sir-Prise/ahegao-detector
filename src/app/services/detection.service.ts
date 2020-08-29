import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { DetectionResponseModel, Box } from './detection-response.model';
declare var faceapi: any;

/**
 * Detects a face from a HTMLVideoElement and gets the probability of it being an ahegao facial expression.
 *
 * It's possible to compare two ahegao models by setting the names of the models in localStorage with the key "compare" and value e.g. "1/2"
 * when you want to compare the model called "1" with "2". The default model has no name, so you probably call it "/2".
 */
@Injectable({
    providedIn: 'root'
})
export class DetectionService {

    private readonly assetsUrl = '/assets';
    private readonly faceapiOptions = new faceapi.TinyFaceDetectorOptions({inputSize: 512, scoreThreshold: 0.5});
    private readonly faceCanvasSize = 75;
    private readonly ahegaoThreshold = 0.6;

    private faceCanvas: HTMLCanvasElement;
    private faceCanvasContext: CanvasRenderingContext2D;
    private ahegaoModel?: tf.LayersModel;
    private ahegaoModelCompare?: tf.LayersModel;

    constructor() { }

    public async load(): Promise<void> {
        // Initialize variables
        this.faceCanvas = document.createElement('canvas');
        this.faceCanvas.width = this.faceCanvasSize;
        this.faceCanvas.height = this.faceCanvasSize;
        this.faceCanvasContext = this.faceCanvas.getContext('2d');

        // Load ahegao detection
        const modelNames = (localStorage.getItem('compare') || '').split('/');
        const ahegaoModelPromise = tf.loadLayersModel(`${this.assetsUrl}/model-ag${modelNames[0]}/model.json`);
        let ahegaoModelComparePromise: Promise<tf.LayersModel>;
        if (modelNames.length > 1) {
            ahegaoModelComparePromise = tf.loadLayersModel(`${this.assetsUrl}/model-ag${modelNames[1]}/model.json`);
        }

        // Load face detection
        const detectionNet = faceapi.nets.tinyFaceDetector;
        await detectionNet.load(this.assetsUrl + '/model-face');
        await faceapi.loadTinyFaceDetectorModel(this.assetsUrl + '/model-face');

        this.ahegaoModel = await ahegaoModelPromise;
        this.ahegaoModelCompare = await ahegaoModelComparePromise;

        // Immediately analyse empty picture to load model
        // TODO
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
                ahegaoProbabilityCompare: this.ahegaoModelCompare ? 0 : undefined,
                isAhegao: false
            };
        }
        const ahegaoProbability = await this.getAhegao();
        return {
            face: faceBox,
            ahegaoProbability: ahegaoProbability[0],
            ahegaoProbabilityCompare: ahegaoProbability[1],
            isAhegao: ahegaoProbability[0] > this.ahegaoThreshold
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

    private async getAhegao(): Promise<[number, number?]> {
        const tensor = tf.browser.fromPixels(this.faceCanvas);
        const convertedTensor = tensor.expandDims(0).toFloat().div(255);
        const resultPromise = this.ahegaoModel.predict(convertedTensor);
        const resultComparePromise = this.ahegaoModelCompare?.predict(convertedTensor);
        const probability = (await resultPromise as tf.Tensor).dataSync()[0];
        let probabilityCompare: number;
        if (resultComparePromise) {
            probabilityCompare = (await resultComparePromise as tf.Tensor).dataSync()[0];
        }
        convertedTensor.dispose();

        return [probability, probabilityCompare];
    }
}
