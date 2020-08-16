import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, HostListener } from '@angular/core';
import { Box } from 'src/app/services/detection-response.model';

@Component({
    selector: 'app-webcam',
    templateUrl: './webcam.component.html',
    styleUrls: ['./webcam.component.scss']
})
export class WebcamComponent {

    @Input()
    set recognitionRectangle(recognitionRectangle: Box | undefined) {
        this._recognitionRectangle = recognitionRectangle;
        if (!this.recognitionRectangleElement) {
            // Component not fully initiated
            return;
        }
        const scale = this.componentWidth / this.cam.nativeElement.videoWidth;
        if (recognitionRectangle) {
            this.recognitionRectangleElement.nativeElement.style.opacity = '1';
            this.recognitionRectangleElement.nativeElement.style.left = `${recognitionRectangle.x * scale}px`;
            this.recognitionRectangleElement.nativeElement.style.top = `${recognitionRectangle.y * scale}px`;
            this.recognitionRectangleElement.nativeElement.style.width = `${recognitionRectangle.width * scale}px`;
            this.recognitionRectangleElement.nativeElement.style.height = `${recognitionRectangle.height * scale}px`;
        } else {
            this.recognitionRectangleElement.nativeElement.style.opacity = '0';
        }
    }
    get recognitionRectangle(): Box | undefined {
        return this._recognitionRectangle;
    }
    private _recognitionRectangle?: Box;

    @Input()
    public isLoading = true;

    @Input()
    public isSlow = false;

    @Input()
    public isNoFaceDetected = false;

    @ViewChild('cam')
    private cam: ElementRef<HTMLVideoElement>;

    @ViewChild('recognitionRectangle')
    private recognitionRectangleElement: ElementRef<HTMLDivElement>;

    private componentWidth = 0;

    constructor(
        private component: ElementRef
    ) { }

    public setVideoStream(stream: MediaStream): Promise<HTMLVideoElement> {
        this.cam.nativeElement.srcObject = stream;
        return new Promise((resolve) => {
            this.cam.nativeElement.onloadedmetadata = () => {
                this.updateOutputVideoSize();
                resolve(this.cam.nativeElement);
            };
        });
    }

    @HostListener('window:resize', ['$event'])
    public onResize() {
        this.updateOutputVideoSize();
    }

    private updateOutputVideoSize(): void {
        // Reset width to get max possible width
        this.component.nativeElement.style.width = '100%';

        const maxWidth = this.component.nativeElement.clientWidth;
        const maxHeight = window.innerHeight;
        const aspectRatio = this.cam.nativeElement.videoWidth / this.cam.nativeElement.videoHeight;

        // Calculate largest possible size
        let width = maxWidth;
        let height = width / aspectRatio;
        if (height > maxHeight) {
            // Height limits size
            height = maxHeight;
            width = height * aspectRatio;
        }

        this.componentWidth = width;
        this.cam.nativeElement.width = width;
        this.cam.nativeElement.height = height;
        this.component.nativeElement.style.width = `${width}px`;
        this.component.nativeElement.style.height = `${height}px`;
    }
}
