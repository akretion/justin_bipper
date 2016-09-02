import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OnChanges } from '@angular/core';

@Component({
  selector: 'input-bar',
  styles: [`
      input {
        box-shadow:none;
      }
  `],
  template: `
  <form (ngSubmit)="addIt(model)" #f="ngForm">
    <ion-input [(ngModel)]="model.scanned" name="scanned" placeholder="Scan something" required></ion-input>
    <button type="submit" [disabled]="!f.valid">Validate</button>
  </form>`,
})
export class inputBarComponent {
  @Output() cb = new EventEmitter();
  model: any;
  constructor() {
    this.reset();
    console.log('dans inputbar component');
  }
  addIt() {
    console.log('dans addit !', this.model);
    this.cb.emit(this.model.scanned);
    this.reset();
  }
  reset() {
    this.model = {};
  }
}
