import { Injectable } from '@angular/core';
import { ButtplugClientDevice, ButtplugClient, ButtplugEmbeddedClientConnector } from 'buttplug';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DeviceService {

    public connectedDevices: ButtplugClientDevice[] = [];
    public deviceChanges$ = new Subject<{event: 'connected' | 'disconnected', device: ButtplugClientDevice}>();
    public errors$ = new Subject<Error>();

    private readonly connector = new ButtplugEmbeddedClientConnector();
    private readonly client = new ButtplugClient('Ahegao Detector');
    private clientConnected = false;

    constructor() {
        this.client.addListener('deviceadded', this.onDeviceAdded.bind(this));
        this.client.addListener('deviceremoved', this.onDeviceRemoved.bind(this));
    }

    public async connect(): Promise<void> {
        try {
            if (!this.clientConnected) {
                await this.client.Connect(this.connector);
                this.clientConnected = true;
            }
            await this.client.StartScanning();
        } catch (e) {
            this.errorHandler(e);
        }
    }

    public async setIntesity(intensity: number): Promise<void> {
        try {
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
        } catch (e) {
            this.errorHandler(e);
        }
    }

    private onDeviceAdded(device: ButtplugClientDevice): void {
        this.connectedDevices.push(device);
        this.deviceChanges$.next({event: 'connected', device});
    }

    private onDeviceRemoved(device: ButtplugClientDevice): void {
        const index = this.connectedDevices.indexOf(device);
        this.connectedDevices.splice(index, 1);
        this.deviceChanges$.next({event: 'disconnected', device});
    }

    private errorHandler(error: Error): void {
        console.error(error);
        this.errors$.next(error);
    }
}
