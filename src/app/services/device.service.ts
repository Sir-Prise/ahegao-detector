import { Injectable } from '@angular/core';
import { ButtplugClientDevice, ButtplugClient, ButtplugEmbeddedClientConnector } from 'buttplug';

@Injectable({
    providedIn: 'root'
})
export class DeviceService {

    public connectedDevices: ButtplugClientDevice[] = [];

    private readonly connector = new ButtplugEmbeddedClientConnector();
    private readonly client = new ButtplugClient('Ahegao Detector');

    constructor() {
        this.client.addListener('deviceadded', this.onDeviceAdded.bind(this));
        this.client.addListener('deviceremoved', this.onDeviceRemoved.bind(this));
    }

    public async connect(): Promise<void> {
        await this.client.Connect(this.connector);
        await this.client.StartScanning();
    }

    public async setIntesity(intensity: number): Promise<void> {
        if (intensity <= 0) {
            // Stop all
            for (const device of this.connectedDevices) {
                device.SendStopDeviceCmd();
            }
            return;
        }
        for (const device of this.connectedDevices) {
            if (device.AllowedMessages.includes('VibrateCmd')) {
                device.SendVibrateCmd(intensity);
            }
            // TODO: Other types
        }
    }

    private onDeviceAdded(device: ButtplugClientDevice): void {
        this.connectedDevices.push(device);
    }

    private onDeviceRemoved(device: ButtplugClientDevice): void {
        const index = this.connectedDevices.indexOf(device);
        this.connectedDevices.splice(index, 1);
    }
}
