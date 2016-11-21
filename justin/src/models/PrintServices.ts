import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from "rxjs/Observable";

@Injectable()
export class PrintServices {
  printers = ['dymo', 'zebra'];
  constructor(public http: Http) {
  }
  setSettings(settings) {
    console.log('dans set settings', settings);
    this.printers.forEach( p => {
      if (settings[p])
        this.setUrl(p, settings[p])
    });
  }
  getSettings() {
      var out = {}
      this.printers.forEach( p => out[p]= this.getUrl(p))
      return out;
  }
  setUrl(key, val) {
    localStorage.setItem(key, val);
  }
  getUrl(key) {
    return localStorage.getItem(key);
  }
  printZebra(payload) {
    return this.print('zebra', payload);
  }
  printDymo(payload) {
    return this.print('dymo', payload);
  }
  print(printer, payload) {
    var url = this.getUrl(printer);
		var req = {
			args: ['label', payload],
			kwargs: { options: {
				'raw': true,
				'copies': 1
				}
			}
		};
		return this.http.post(url+'cups/printData', JSON.stringify(req));
	}
}
