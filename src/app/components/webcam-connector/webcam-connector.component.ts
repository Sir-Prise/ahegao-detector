import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DetectionService } from 'src/app/services/detection.service';
import { Observable, from, forkJoin } from 'rxjs';
import { WebcamComponent } from '../webcam/webcam.component';

@Component({
    selector: 'app-webcam-connector',
    templateUrl: './webcam-connector.component.html',
    styleUrls: ['./webcam-connector.component.scss']
})
export class WebcamConnectorComponent implements OnInit {

    @Input()
    public webcamComponent: WebcamComponent;

    @Output()
    public loaded = new EventEmitter<HTMLMediaElement>();

    public showWebcam = false;
    public showLoading = false;
    public showNotAllowedError = false;
    public error: string | undefined;

    public readonly hasWebcam = navigator.mediaDevices.enumerateDevices().then((info) => !!info.length);

    private isModelLoaded$: Observable<void>;
    private isWebcamLoaded$: Observable<HTMLMediaElement>;

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

            this.showLoading = true;
            forkJoin(this.isWebcamLoaded$, this.isModelLoaded$).subscribe(([webcam]) => {
                this.showLoading = false;
                this.loaded.emit(webcam);
            });

        } catch (e) {
            console.log(e);
            if (e.name === 'NotAllowedError') {
                this.showNotAllowedError = true;
            } else {
                this.error = e.message;
            }
        }
    }

    private disconnect(): void {
        this.showWebcam = false;
        this.showLoading = false;
    }
}
