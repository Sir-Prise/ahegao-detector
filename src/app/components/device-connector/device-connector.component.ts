import { Component, OnInit } from '@angular/core';
import { DeviceService } from 'src/app/services/device.service';

@Component({
    selector: 'app-device-connector',
    templateUrl: './device-connector.component.html',
    styleUrls: ['./device-connector.component.scss']
})
export class DeviceConnectorComponent implements OnInit {

    public collapsed = true;

    public readonly isIos = !!/(iPad|iPod|iPhone)/.exec(navigator.platform);
    public readonly supportsBluetooth = !!(navigator as any).bluetooth;
    public readonly hasBluetooth$ = (navigator as any).bluetooth?.getAvailability();

    constructor(
        public readonly deviceService: DeviceService
    ) { }

    public ngOnInit(): void {
    }

    public toggleCollapse(): void {
        this.collapsed = !this.collapsed;
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
