import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from "rxjs/Observable";

@Injectable()
export class PrintServices {
  printers = ['dymo', 'zebra', 'a4'];
  constructor(public http: Http) {
    window['http'] = this.http;
  }
  setSettings(settings) {
    console.log('dans set settings', settings);
    this.printers.forEach( p => {
      if (settings[p])
        this.persist(p, settings[p])
    });
  }
  getSettings() {
      var out = {}
      this.printers.forEach( p => out[p]= this.load(p))
      return out;
  }
  persist(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
  load(key) {
    return JSON.parse(localStorage.getItem(key)) || {name: null, url: null};
  }
  printZebra(payload) {
    return this.print('zebra', payload);
  }
  printDymo(payload) {
    return this.print('dymo', payload);
  }
  printA4(payload) {
    return this.print('a4', payload);
  }
  print(printer, payload) {
    var config = this.load(printer);
		var req = {
			args: [config['name'], payload],
			kwargs: { options: {
				'copies': 1
				}
			}
		};
    if (printer == 'zebra')
      req.kwargs.options['raw'] = true;
      //pywebdriver rale si raw = false !

    console.log('on va print', req);
		return this.http.post(config['url']+'/cups/printData', req).toPromise();
	}
}
