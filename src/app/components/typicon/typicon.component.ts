import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-typicon',
    // template: '<img [src]="\'/assets/typicons/svg/\' + icon + \'.svg\'" [alt]="icon" />',
    template: '<span [class]="\'typcn typcn-\' + icon"></span>',
    styleUrls: ['./typicon.component.scss']
})
export class TypiconComponent implements OnInit {

    @Input()
    public icon: string;

    constructor() { }

    ngOnInit(): void {
    }

}
