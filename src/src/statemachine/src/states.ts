
export class Shipment {
  packs: Array<Pack> = [];
  name = 'WH/OUT102';
  carrier = '';
  export_label_warning = false;
  products = [];
  picking_id = 0;
  partial_allowed = false;
  stateMachine: StateMachine;
  statesAction: Array<any>;
  constructor() {
    this.stateMachine = new StateMachine();
    this.stateMachine.state = 'init';
    this.stateMachine.events = <Array<StateEvent>>([
      { name:'créer', from: 'init', to: 'waiting', conditions: [], actions:[]}, //liste de packs ou de produits?
      //de receptions, de colisage, de destockage
      { name:'setPack', from: 'waiting', to:'waiting',
      conditions: [
      ], actions:[
        (args) => {
          let pack = args.pack;
          if (this.packs.indexOf(pack) === -1)
            this.packs.push(pack);
        }
      ]},
      { name:'update', from: 'waiting',  to: 'to ship',
      conditions: [
        () => { if (!this.packs.length)
          return Promise.reject('Pas de packs');
        },
        () => {
          if (!this.partial_allowed)
            return Promise.all(this.packs.map( (pack) => pack.stateMachine.can('assembler')));
         },
        () => {
          if (this.partial_allowed)
            return Promise.resolve('partial allowed');
          if (!this.products.every( (product) => product.stateMachine.state === 'packed'))
            return Promise.reject('Tous les produits ne sont pas packeds');
        }
      ], actions:[ ]},
      { name:'assembler', from: 'to ship', to: 'shipped', conditions: [
        () => {
          if (!this.partial_allowed)
            return Promise.all(this.packs.map( (p) => p.stateMachine.can('assembler')))
        }
      ], actions:[
        () => {
          if (!this.partial_allowed)
            this.packs.forEach( (p) => p.stateMachine.go('assembler') )
        }
      ]},
      { name:'group', from: 'waiting', to: 'waiting', conditions: [
        (args) => {
          let weight = parseFloat(args.weight);
          if (!args.weight)
            return Promise.reject("pas de poids");
          if (weight <= 0)
            return Promise.reject('poids null');
        },
        (args) => {
          if(!args.packs.every(pack => pack.shipment == args.packs[0].shipment))
            return Promise.reject('All the packs are not from the same shipment');
        },
        (args) => {
          // ensure all pack can group. ie None of them has been shipped
          return Promise.all(args.packs.map( p => p.stateMachine.can('group')));
        }
      ], actions: [
        (args) => {
          // change state of old packs to grouped
          let packs = args.packs;
          let newPack = args.newPack;
          let products = args.packs.flatMap((p: Pack) => p.products);
          return Promise.all(
            packs.map((p: Pack) => {
              let ret = p.stateMachine.go('group')
              // remove packs from this shipment
              // we don't want to see them after a group
              let idx = this.packs.indexOf(p);
              if (idx >= 0)
                this.packs.splice(idx, 1);
              return ret;
            })
          ).then(() => {
            // create a new pack and colise it
            let weight = parseFloat(args.weight);
            return newPack.coliser(weight, products).then(
              () => this.setPack(newPack)
            );
          });
        }
      ]}
    ]);

    this.statesAction = [
      {name: 'waiting', action: () => {
        var nextStep = new Set();
        let prodSteps = new Set();
        let shipSteps = new Set();
        let packSteps = new Set();

        let stepsOfCollection = (collection) => {
          let set = new Set();
          collection.forEach(item =>
            item.nextSteps().forEach(step=> set.add(step))
          )
          return set;
        }
        prodSteps = stepsOfCollection(this.products);
        packSteps = stepsOfCollection(this.packs);

        prodSteps.forEach( s => shipSteps.add(s) );
        packSteps.forEach( s => shipSteps.add(s) );

        let allProductsDone = prodSteps.has('unpack') && prodSteps.size == 1;
        if (!allProductsDone) {
          //des produits sont pas fini
          //y-t-il des packs en stock ?
          shipSteps.delete('destocker');
          //dans tous les cas on assemble pas
          shipSteps.delete('assembler');
        } else {
          //les produits sont tous packeds
          //on a pas le droit de stocker
          if (packSteps.has('destocker')) {
            shipSteps.delete('assembler');
            shipSteps.delete('stocker');
          } else {
            //normalement on a que de l'assemblage
            shipSteps.delete('stocker');
          }
        }
        return shipSteps;
      }},
      {name:'to ship', action: () => {

        var nextSteps = new Set()
        this.packs.forEach(
          (pack)=> {
            pack.nextSteps().map( (ste) => nextSteps.add(ste) )
          }
        );
        return nextSteps;
      }}
    ];
  }
  créer(){
    return this.stateMachine.go('créer');
  }
  setPack(pack) {
    return this.stateMachine.go('setPack', {pack: pack});
  }
  update() { //= sommes nous dernier ?
    //mettre à jour l'etat
    return this.stateMachine.go('update');
  }
  assembler() {
    return this.stateMachine.go('assembler');
  }
  étiqueter(transporteur) {
    return this.stateMachine.go('print');
  }
  charger() {
//    this.stateMachine.go('');
  }
  group(weight, packs, newPack) {
    return this.stateMachine.go('group', { packs: packs, weight: weight, newPack: newPack});
  }
  nextSteps() {
    var stateAction = this.statesAction.find((s) => s.name == this.stateMachine.state );
    if (!stateAction){
      console.info('stateAction introuvable', this.stateMachine.state, this.statesAction)
      return [];
    }
    return Array.from(stateAction.action());
  }
};

export class Pack { //carton
  products: Array<Product> = [];//contien des doublons
  shipment: Shipment;
  name: String;
  label: String;
  place: String;
  category: String;
  weight = 0;
  stateMachine: StateMachine;
  statesAction: Array<any>;
  constructor() {
    this.stateMachine = new StateMachine();
    this.stateMachine.state = 'init';
    this.stateMachine.events = <Array<StateEvent>>([
      {name:'coliser', from: 'init', to: 'transit', conditions: [
        (args) => {
          let weight = parseFloat(args.weight);
          if (!args.weight)
            return Promise.reject("pas de poids");
          if (weight <= 0)
            return Promise.reject('poids null');
        },
        (args) => {
          if (!args.products || !args.products.length)
            return Promise.reject('Pas de produits');
          let ship = args.products[0].shipment;
          if (!args.products.every(prod => prod.shipment == ship))
            return Promise.reject('All the products are not from the same shipment');
        },
        (args) => {
          if (!args.products || !args.products.length)
            return Promise.reject('Pas de produits');
          return Promise.all(
            args.products.map(prod => prod.stateMachine.can('coliser', {pack: this}))
          ).catch( (err) => Promise.reject("All the products are not packable"+ err));
        }
      ], actions:[
        (args) => this.weight = parseFloat(args.weight),
        (args) => this.products = args.products,
        (args) => this.products.forEach( prod => prod.coliser(this))
      ]},
      {name:'stocker', from: 'transit', to:'stock', conditions: [], actions: [
        (args) => {
          this.place = args.place;
        }
      ]},
      {name:'destocker', from: 'stock', to:'transit', conditions: [], actions:[
        (args) => this.place = null
      ]},
      {name:'assembler', from: 'transit', to: 'shipped', conditions: [], actions:[]},
      {name:'charger', from: 'shipped', to:'done', conditions: [], actions:[]},
      {name:'group', from: 'transit', to: 'groupped', conditions: [], actions: [
        (args) => { // unpack all the products of the current pack
          var products = this.products;
          return Promise.all(
            products.map(prod => prod.unpack())
          ).then(()=> {
            this.products = [];
          });
        }
      ]}
    ]);

    this.statesAction = [
      { name:'init', action: () => {
        return new Set(['coliser']);
      }},
      { name:'transit', action: () => {
        return new Set(['assembler','stocker', 'group']);
      }},
      { name:'stock', action: () => {
        return new Set(['destocker']);
      }},
      { name:'shipped', action: () => {
        return new Set(['charger']);
      }},
    ];
  }
  coliser(weight, products: Array<Product>) {
    return this.stateMachine.go('coliser', {weight: weight, products: products});
  }
  assembler() {
    return this.stateMachine.go('assembler');
  }
  stocker(place) {
    return this.stateMachine.go('stocker', { place: place});
  }
  destocker() {
    return this.stateMachine.go('destocker');
  }
  charger() {
    return this.stateMachine.go('charger');
  }
  group() {
    return this.stateMachine.go('group');
  }
  nextSteps() {
    var stateAction = this.statesAction.find((s) => s.name == this.stateMachine.state );
    if (!stateAction)
      return [];
    return Array.from(stateAction.action());
  }
}

 export class Product { //chaque produit est unique
  name = '';
  weight = 0;
  shipment: Shipment;
  isExpected = true;
  pack: Pack;
  category: String;
  stateMachine: StateMachine;
  move_id = 0;
  constructor() {
    this.stateMachine = new StateMachine();
    this.stateMachine.events = <Array<StateEvent>>[
      { name:'produire', from: 'init', to: 'available', conditions: [], actions:[]}, //produire is done on odoo
      { name:'receptionner', from: 'available', to: 'received', conditions: [], actions:[]},
      { name:'coliser', from: 'received', to: 'packed', conditions: [
        (args) => {
          let pack = args.pack;
          if (!pack)
            return Promise.reject('No pack');
          return Promise.resolve();
        }
      ], actions:[
          (args) => {
            this.pack = args.pack;
          }
      ]},
      { name: 'unpack', from: 'packed', to: 'received', conditions: [], actions: [
        () => {
          this.pack = null;
        }
      ]}
    ];
  }
  receptionner() {
    return this.stateMachine.go('receptionner');
  }
  coliser(pack:Pack) {
    return this.stateMachine.go('coliser', {pack: pack});
  }
  unpack() {
    return this.stateMachine.go('unpack');
  }
  nextSteps() {
    var nextSteps = [];
    if (this.stateMachine.state == 'available')
        nextSteps = ["receptionner"]
    if (this.stateMachine.state == 'received')
        nextSteps = ["coliser"];
    if (this.stateMachine.state == "packed")
        nextSteps = ["unpack"];
    if (this.stateMachine.state == 'init')
        nextSteps = ['produire'];
    return nextSteps;
  }
}


export class StateEvent {
  name: string;
  from: string;
  to: string;
  conditions: Array<any> = [];
  actions: Array<any> = [];
}
export class StateMachine {
  events: Array<StateEvent>;
  state: string = 'init';
  public availableState() {
    return this.events.filter((s:any) => s.from == this.state);
  }
  public nextState(event) {
    return this.availableState().filter((s:any) => s.name == event)[0];
  }
  public possibleStates() {
    return new Promise(
      (resolve, reject) => {
        let succeeds = [];
        let proms = this.availableState().map(
          state => this.can(state.name).then(
            () => succeeds.push(state.name)
          , (x) => null) //on veut pas d'erreur sur les etats impossibles
        );
        Promise.all(proms).then(
          () => resolve(succeeds)
        );
      }
    );
  }
  public can(event, args = {}) {
    var nextState = this.nextState(event)
    if (!nextState) {
      return Promise.reject("Invalid state " + event + " Available: " + this.availableState().map(x => x.name).join(', '));
    }

    function every(tab) {
      return Promise.all(tab.map( f => f(args)));
    }
    return every(nextState.conditions).then(
      () => {
        return Promise.resolve((conditions, actions) => {
          return every(nextState.actions).then(
            () => {
              this.state = nextState.to
              return this.state;
            }
          );
        })
      }
    );
/*    return Promise.resolve( (conditions, actions) => {
        if (nextState.conditions)
          conditions = nextState.conditions;
        if (nextState.actions)
          actions = nextState.actions;

        function every(tab) {
          return Promise.all(tab.map( f => f(self)));
        }
        return every(conditions).then(() => every(actions)).then(
          () => this.state = nextState.to
        );
    });*/
  }
  public go(event, args = {}) {
    return this.can(event, args).then( (f) => {
      return f(null, null)
    });
  }
}
