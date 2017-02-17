import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OnChanges } from '@angular/core';
import { Renderer, ElementRef } from  '@angular/core';

@Component({
  selector: 'input-bar',
  styles: [`
      .inputBar {
        padding: 8px;
      }

  `],
  template: `
  <form (ngSubmit)="addIt()" #f="ngForm">
    <div class="inputBar" style="">
      <div class="searchbar-input-container">
        <div class="searchbar-search-icon"></div>
        <input class="searchbar-input" [(ngModel)]="model.scanned" type="search" name="scanned" placeholder="Scan something"  autocomplete="off" autocorrect="off" spellcheck="false">
        <button ion-button class="searchbar-clear-icon button button-clear" clear="" ng-reflect-clear=""><span class="button-inner"></span></button>
      </div>
    </div>
  </form>
  `,

})
export class inputBarComponent {
  @Output() cb: EventEmitter<any> = new EventEmitter();
  model: any;
  constructor(private renderer:Renderer, private elementRef: ElementRef) {
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
  ngAfterViewInit() {
    var el = this.elementRef.nativeElement.querySelector('input');
    setTimeout( () => {
      this.renderer.invokeElementMethod(el, 'focus', []);
      el.autofocus = true;
    },500);
  }
}
