import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: 'button[appAutoBlur]'
})
export class ButtonDirective {

    @HostListener('click', ['$event'])
    public onClick($event) {
        $event.target.blur();
    }
}
