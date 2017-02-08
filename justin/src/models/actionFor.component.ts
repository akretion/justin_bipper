import { Component, Input } from '@angular/core';
import { OnChanges } from '@angular/core';

import { RouteService } from './route.Service';

@Component({
  selector: 'nextApp',
  template: `
    <button ion-button *ngIf="step" outline (click)="open(thing)" class="item-button">{{ step }}</button>
  `,
})
export class nextAppComponent implements OnChanges {
  model = { msg: ''}
  step = "";
  @Input() thing: any;
  constructor(private routeService: RouteService) {
    console.log('je suis un constructeur');
  }
  open(thing) {
    let steps = thing.nextSteps();
    console.log('possibles steps for', thing, steps)
    this.routeService.goTo(steps.pop(), { 'scanned': thing.name });
  }
  ngOnChanges(a) { //C'est notre $watch
    console.log('dans le on Change', a);
    let thing = a.thing.currentValue
    if (thing)
      this.step = thing.nextSteps().join("");
    console.log(this.step, thing);
  }
}
