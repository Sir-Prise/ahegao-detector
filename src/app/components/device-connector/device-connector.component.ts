import { Component, OnInit } from '@angular/core';
import { DeviceService } from 'src/app/services/device.service';
import { ButtplugClientDevice } from 'buttplug';

@Component({
    selector: 'app-device-connector',
    templateUrl: './device-connector.component.html',
    styleUrls: ['./device-connector.component.scss']
})
export class DeviceConnectorComponent implements OnInit {

    public collapsed = true;

    public readonly supportsBluetooth = !!(navigator as any).bluetooth;
    public readonly isIos = !this.supportsBluetooth && !!/(iPad|iPod|iPhone)/.exec(navigator.platform);
    public readonly hasBluetooth$: Promise<boolean> | undefined = (navigator as any).bluetooth?.getAvailability();

    public devices: Array<{status: 'connected' | 'disconnected', device: ButtplugClientDevice}> = [];
    public isDeviceConnected = false;
    public isTesting = false;

    public error?: string;
    public isUnknownConnectionError = false;

    constructor(
        private readonly deviceService: DeviceService
    ) {
        // Using an own list of devices instead of this.deviceService.connectedDevices to be able to list disconnected devices
        this.deviceService.deviceChanges$.subscribe((event) => {
            // Remove existing devices with the same name and old status
            this.devices = this.devices.filter((device) => {
                return device.device.Name !== event.device.Name || device.status === event.event;
            });
            // Add device
            this.devices.push({device: event.device, status: event.event});

            this.isDeviceConnected = !!this.deviceService.connectedDevices.length;
        });

        // Display errors caused by DeviceService
        this.deviceService.errors$.subscribe((error: Error) => {
            // Handle known error messages
            if (error.message.includes('Connection failed for unknown reason')) {
                this.isUnknownConnectionError = true;
                return;
            }

            this.error = error.message;
        });
    }

    public ngOnInit(): void {
    }

    public toggleCollapse(): void {
        this.collapsed = !this.collapsed;
    }

    public async startScanning(): Promise<void> {
        await this.deviceService.connect();
    }

    public async test(): Promise<void> {
        this.isTesting = true;
        await this.deviceService.setIntesity(0.2, true);
        setTimeout(async () => {
            await this.deviceService.setIntesity(0, true);
            this.isTesting = false;
        }, 1000);
    }
}
