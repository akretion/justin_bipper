import { Component, Input } from '@angular/core';
import { OnChanges } from '@angular/core';

import { RouteService } from './route.Service';

@Component({
  selector: 'nextApp',
  template: `
    <button ion-button *ngFor="let step of steps" outline (click)="open(step.action, thing)" class="item-button">{{ step.title }}</button>
  `,
})
export class nextAppComponent implements OnChanges {
  model = { msg: ''}
  steps = [];
  @Input() thing: any;
  constructor(private routeService: RouteService) {
  }
  open(step, thing) {
    this.routeService.goTo(step, { 'scanned': thing.name });
  }
  ngOnChanges(a) { //C'est notre $watch
    let thing = a.thing.currentValue
    if (thing)
      this.steps = thing.nextSteps().map(
        s => ({ action: s, title: this.routeService.getPageTitle(s)})
      );
  }
}
