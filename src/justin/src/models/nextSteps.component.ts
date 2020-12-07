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
  @Input() withArgs: boolean = true;
  constructor(private routeService: RouteService) {
  }
  open(step, thing) {
    this.routeService.goTo(step, (this.withArgs) ? { 'scanned': thing.name } : null );
  }
  ngOnChanges(a) { //C'est notre $watch
    let thing = a.thing.currentValue
    if (thing)
      this.refreshThing(thing);
  }
  refresh() {
    this.refreshThing(this.thing);
  }
  refreshThing(thing) {
    this.steps = thing.nextSteps().map(
      s => ({ action: s, title: this.routeService.getPageTitle(s)})
    );
  }
}
