import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs/ReplaySubject';

@Injectable()
export class RouteService {
  subject;
  observable;
  appRoutes = [];

  constructor() {
    console.log('je suis construit');
    this.subject = new ReplaySubject<string>();
    this.observable = this.subject.asObservable()
  }
  get() {
    return this.observable;
  }
  goTo(action) {
    let page = this.appRoutes.find(
      (r) => r.action == action
    );
    this.subject.next(page);
  }
  setRoutes(routes) {
    //TO avoir circular dependencies
    //works only if we are in a singleton
    return this.appRoutes = routes;
  }
}
