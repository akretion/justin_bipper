import { AlertController } from 'ionic-angular';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class DeadManSwitchService {
    /*
        Detect a period of user inactivity then call callback()
    */
    obs: any;
    pauser: any;
    callback: Function;
    INACTIVITY_DURATION = 2 * 1000 * 60; // 2 minutes
    constructor(
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
        this.pauser.next(false);
    }
    stop() {
        // called by logout
        this.pauser.next(true);
    }
    setCallback(evt) {
        this.callback = evt;
    }
}
