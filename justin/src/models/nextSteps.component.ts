import { Component, Input } from '@angular/core';
import { OnChanges } from '@angular/core';

import { RouteService } from './route.Service';

@Component({
  selector: 'nextApp',
  template: `
    <button ion-button *ngFor="let step of steps" outline (click)="open(step, thing)" class="item-button">{{ step }}</button>
  `,
})
export class nextAppComponent implements OnChanges {
  model = { msg: ''}
  steps = [];
  @Input() thing: any;
  constructor(private routeService: RouteService) {
    console.log('je suis un constructeur');
  }
  open(step, thing) {
    console.log('possibles steps for', thing, step)
    this.routeService.goTo(step, { 'scanned': thing.name });
  }
  ngOnChanges(a) { //C'est notre $watch
    console.log('dans le on Change', a);
    let thing = a.thing.currentValue
    if (thing)
      this.steps = thing.nextSteps();
    console.log(this.steps, thing);
  }
}
