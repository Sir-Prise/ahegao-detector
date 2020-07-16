import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebcamComponent } from './components/webcam/webcam.component';
import { DeviceConnectorComponent } from './components/device-connector/device-connector.component';
import { TypiconComponent } from './components/typicon/typicon.component';
import { AlertComponent } from './components/alert/alert.component';

@NgModule({
    declarations: [
        AppComponent,
        WebcamComponent,
        DeviceConnectorComponent,
        TypiconComponent,
        AlertComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
