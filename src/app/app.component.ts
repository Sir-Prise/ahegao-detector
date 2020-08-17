import { Component, OnInit, HostListener} from '@angular/core';
import { ProgressService } from './services/progress.service';
import { DeviceService } from './services/device.service';
import { DetectionLoopService } from './services/detection-loop.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    private camElement: HTMLVideoElement;

    constructor(
        public readonly detectionLoopService: DetectionLoopService,
        public readonly progressService: ProgressService,
        public readonly deviceService: DeviceService,
    ) {
    }

    public ngOnInit(): void {
        this.detectionLoopService.isAhegao$.subscribe((isAhegao) => {
            document.querySelector('meta[name="theme-color"]').setAttribute('content',  isAhegao ? '#ff69b4' : '#ffe9ec');
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    public onTabClose() {
        this.deviceService.setIntesity(0, true);
    }

    public async onPause(): Promise<void> {
        this.detectionLoopService.pause();
    }

    public async onResume(): Promise<void> {
        this.detectionLoopService.start(this.camElement);
    }

    public camLoaded(event: HTMLVideoElement): void {
        this.camElement = event;
        this.detectionLoopService.start(this.camElement);
    }
}
