import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DetectionService } from 'src/app/services/detection.service';
import { Observable, from, forkJoin } from 'rxjs';
import { WebcamComponent } from '../webcam/webcam.component';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
    selector: 'app-webcam-connector',
    templateUrl: './webcam-connector.component.html',
})
export class WebcamConnectorComponent implements OnInit {

    @Input()
    public webcamComponent: WebcamComponent;

    @Output()
    public loaded = new EventEmitter<HTMLVideoElement>();

    public showWebcam = false;
    public showNotAllowedError = false;
    public error: string | undefined;

    public readonly hasWebcam = navigator.mediaDevices.enumerateDevices().then((info) => !!info.length);
    public readonly isFirefox = typeof window['InstallTrigger'] !== 'undefined';

    private isModelLoaded$: Observable<void>;
    private isWebcamLoaded$: Observable<HTMLVideoElement>;

    constructor(
        private readonly detectionService: DetectionService,
    ) { }

    ngOnInit(): void {
        // Immediately start loading detection model
        this.isModelLoaded$ = from(this.detectionService.load());
    }

    public async connect(): Promise<void> {
        // Load webcam
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: 'user',
                    height: { ideal: 2160 } // Get highest possible resolution
                }
            });

            // Register revoke permission event
            videoStream.getVideoTracks()[0].addEventListener('ended', this.disconnect.bind(this));

            this.showWebcam = true;
            this.showNotAllowedError = false;
            this.isWebcamLoaded$ = from(this.webcamComponent.setVideoStream(videoStream));
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
            AnalyticsService.event('cam connected', 'cam');

            this.webcamComponent.isLoading = true;
            forkJoin([this.isWebcamLoaded$, this.isModelLoaded$]).subscribe(([webcam]) => {
                this.loaded.emit(webcam);
            });

        } catch (e) {
            console.error(e);
            if (e.name === 'NotAllowedError') {
                this.showNotAllowedError = true;
            } else {
                this.error = e.message;
            }
        }
    }

    private disconnect(): void {
        this.showWebcam = false;
        this.webcamComponent.isLoading = false;
    }
}
