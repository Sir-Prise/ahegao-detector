import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebcamComponent } from './components/webcam/webcam.component';
import { DeviceConnectorComponent } from './components/device-connector/device-connector.component';

@NgModule({
    declarations: [
        AppComponent,
        WebcamComponent,
        DeviceConnectorComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
