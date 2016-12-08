import {Component} from '@angular/core';

@Component({
  templateUrl: 'carrier.html',
})
export class CarrierPage {
  constructor(shipment)
  {
      console.log('je suis carrier page constructor', shipment);
  }
}
