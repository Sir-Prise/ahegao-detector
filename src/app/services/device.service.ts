import { Injectable } from '@angular/core';
import type { ButtplugClientDevice } from 'buttplug';
import { Subject } from 'rxjs';

/**
 * Currently, the Buttplug library mustn't get minified. To avoid having the whole project unminified, the library is included as additional
 * script and not usual import.
 */

@Injectable({
    providedIn: 'root'
})
export class DeviceService {

    public connectedDevices: ButtplugClientDevice[] = [];
    public deviceChanges$ = new Subject<{event: 'connected' | 'disconnected', device: ButtplugClientDevice}>();
    public errors$ = new Subject<Error>();

    private _intensity$ = new Subject<number>();
    public get intensity$(): Subject<number> {
        return this._intensity$;
    }

    private readonly connector = new window['Buttplug'].ButtplugEmbeddedClientConnector();
    private readonly client = new window['Buttplug'].ButtplugClient('Ahegao Detector');
    private clientConnected = false;
    private runningCommand?: Promise<any>;
    private inPriority = false;

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

    /**
     * Sets the intensity (vibration, stroking speed, etc.) of all connected devices
     * @param intensity Value between 0 and 1
     * @param priority If set to true, the intensity remains until an other call with priority was made.
     */
    public async setIntesity(intensity: number, priority = false): Promise<void> {
        try {
            if (this.inPriority && !priority) {
                return;
            }
            if (priority) {
                this.inPriority = intensity > 0;
            }

            // There mustn't be commands running at the same time, so wait if there's currently one on the way.
            await this.runningCommand;

            this._intensity$.next(intensity);
            if (intensity <= 0) {
                // Stop all
                for (const device of this.connectedDevices) {
                    this.runningCommand = device.SendStopDeviceCmd();
                }
                return;
            }
            for (const device of this.connectedDevices) {
                if (device.AllowedMessages.includes('VibrateCmd')) {
                    this.runningCommand = device.SendVibrateCmd(intensity);
                }
                // TODO: Other types
            }
            await this.runningCommand;
            this.runningCommand = undefined;
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
