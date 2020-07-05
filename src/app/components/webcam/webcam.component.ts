import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, HostListener } from '@angular/core';
import { Box } from 'src/app/services/detection-response.model';

@Component({
    selector: 'app-webcam',
    templateUrl: './webcam.component.html',
    styleUrls: ['./webcam.component.scss']
})
export class WebcamComponent implements OnInit, AfterViewInit {

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

    @Output()
    public loaded = new EventEmitter<HTMLVideoElement>();

    @ViewChild('cam')
    private cam: ElementRef<HTMLVideoElement>;

    @ViewChild('recognitionRectangle')
    private recognitionRectangleElement: ElementRef<HTMLDivElement>;

    private componentWidth = 0;
    private componentHeight = 0;

    constructor(
        private component: ElementRef
    ) { }

    public ngOnInit(): void {
    }

    public async ngAfterViewInit(): Promise<void> {
        await this.initCamera();
        this.loaded.emit(this.cam.nativeElement);
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
        this.componentHeight = height;
        this.cam.nativeElement.width = width;
        this.cam.nativeElement.height = height;
        this.component.nativeElement.style.width = `${width}px`;
        this.component.nativeElement.style.height = `${height}px`;
    }
}
