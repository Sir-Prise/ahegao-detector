import { Component, OnInit } from '@angular/core';
import { DeviceService } from 'src/app/services/device.service';

@Component({
    selector: 'app-device-connector',
    templateUrl: './device-connector.component.html',
    styleUrls: ['./device-connector.component.scss']
})
export class DeviceConnectorComponent implements OnInit {

    constructor(
        public readonly deviceService: DeviceService
    ) { }

    public ngOnInit(): void {
    }

    public async startScanning(): Promise<void> {
        await this.deviceService.connect();
    }

    public async test(): Promise<void> {
        await this.deviceService.setIntesity(0.2);
        setTimeout(async () => {
            await this.deviceService.setIntesity(0);
        }, 1000);
    }
}
