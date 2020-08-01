import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebcamComponent } from './components/webcam/webcam.component';
import { DeviceConnectorComponent } from './components/device-connector/device-connector.component';
import { TypiconComponent } from './components/typicon/typicon.component';
import { AlertComponent } from './components/alert/alert.component';
import { ButtonDirective } from './components/directives/button.directive';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { WebcamConnectorComponent } from './components/webcam-connector/webcam-connector.component';
import { ProgressComponent } from './components/progress/progress.component';

@NgModule({
    declarations: [
        AppComponent,
        WebcamComponent,
        DeviceConnectorComponent,
        TypiconComponent,
        AlertComponent,
        ButtonDirective,
        WelcomeComponent,
        WebcamConnectorComponent,
        ProgressComponent
        // TODO: Split module
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
