import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from "rxjs/Observable";

@Injectable()
export class AppServices {
  keys = ['app'];
  constructor() {
  }

  setSettings(settings) {
    this.keys.forEach( p => {
      if (settings[p])
        this.persist(p, settings[p])
    });
  }

  getSettings() {
      var out = {}
      this.keys.forEach( p => out[p]= this.load(p))
      return out;
  }

  persist(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  load(key) {
    return JSON.parse(localStorage.getItem(key)) || {autoLogout: true};
  }

  getConfig(key) {
    return this.load(key);
  }
}
