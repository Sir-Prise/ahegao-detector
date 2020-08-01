import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-progress',
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {

    @Input()
    public intensity: number;

    @Input()
    public isIncreasing = false;

    @Input()
    public isDecreasing = false;

    constructor() { }

    ngOnInit(): void {
    }

}
