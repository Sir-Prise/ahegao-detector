import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-typicon',
    template: '<span [class]="\'typcn typcn-\' + icon" [class.uppercase]="uppercase"></span>',
    styleUrls: ['./typicon.component.scss']
})
export class TypiconComponent implements OnInit {

    @Input()
    public icon: string;

    /**
     * Set to true to align the icon sligthly higher, so it's in the middle of uppercase letters.
     */
    @Input()
    public uppercase = false;

    constructor() { }

    ngOnInit(): void {
    }

}
