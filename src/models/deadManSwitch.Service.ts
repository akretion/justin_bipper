import { AlertController } from 'ionic-angular';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import { AppServices } from './../models/AppServices';

@Injectable()
export class DeadManSwitchService {
    /*
        Detect a period of user inactivity then call callback()
    */
    obs: any;
    pauser: any;
    callback: Function;
    INACTIVITY_DURATION = 10 * 1000 * 60; // 10 minutes
    constructor(
        private appServices: AppServices,
        public alertCtrl: AlertController
    ) {
        this.obs = Observable.fromEvent(document, 'click');
        this.pauser = new Subject();
        this.pauser
            .switchMap((paused) => paused ? Observable.never() : this.obs.debounceTime(this.INACTIVITY_DURATION))
            .subscribe( () => { 
                if (this.callback) {
                    return this.callback();
                }
            });
    }
    start() {
        if (this.appServices.getConfig('app').autoLogout){
            this.pauser.next(false);
            console.log('DM service is ON')
        } else {
            console.log('DM service is OFF')
        }
        
    }
    stop() {
        // called by logout
        this.pauser.next(true);
    }
    setCallback(evt) {
        this.callback = evt;
    }
}
