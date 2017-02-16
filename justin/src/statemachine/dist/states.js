export class Shipment {
    constructor() {
        this.packs = [];
        this.name = 'WH/OUT102';
        this.carrier = '';
        this.products = [];
        this.partial_allowed = false;
        this.emplacement = {};
        this.stateMachine = new StateMachine();
        this.stateMachine.state = 'init';
        this.stateMachine.events = ([
            { name: 'créer', from: 'init', to: 'en attente', conditions: [], actions: [] },
            { name: 'setPack', from: 'en attente', to: 'en attente',
                conditions: [], actions: [
                    (args) => {
                        let pack = args.pack;
                        if (this.packs.indexOf(pack) === -1)
                            this.packs.push(pack);
                    }
                ] },
            { name: 'update', from: 'en attente', to: 'à assembler',
                conditions: [
                    () => {
                        if (!this.packs.length)
                            return Promise.reject('Pas de packs');
                    },
                    () => {
                        console.log('on check que les packs soit bien assemblable');
                        return Promise.all(this.packs.map((pack) => pack.stateMachine.can('assembler')));
                    },
                    () => {
                        console.log('on check que tous les produits soient colisés');
                        if (!this.products.every((product) => product.stateMachine.state === 'colisé'))
                            return Promise.reject('Tous les produits ne sont pas colisés');
                    }
                ], actions: [] },
            { name: 'assembler', from: 'à assembler', to: 'assemblé', conditions: [
                    () => Promise.all(this.packs.map((p) => p.stateMachine.can('assembler')))
                ], actions: [
                    () => this.packs.forEach((p) => p.stateMachine.go('assembler'))
                ] },
            { name: 'print', from: 'assemblé', to: 'étiqueté', conditions: [], actions: [
                    (transporteur) => { this.carrier = transporteur; }
                ] },
            { name: 'charger', from: 'étiqueté', to: 'chargé', conditions: [], actions: [] },
        ]);
        this.statesAction = [
            { name: 'en attente', action: () => {
                    var nextStep = new Set();
                    let prodSteps = new Set();
                    let shipSteps = new Set();
                    let packSteps = new Set();
                    let stepsOfCollection = (collection) => {
                        let set = new Set();
                        collection.forEach(item => item.nextSteps().forEeach(step => set.add(step)));
                        return set;
                    };
                    prodSteps = stepsOfCollection(this.products);
                    packSteps = stepsOfCollection(this.packs);
                    prodSteps.forEach(s => shipSteps.add(s));
                    packSteps.forEach(s => shipSteps.add(s));
                    if (prodSteps.size > 0) {
                        shipSteps.delete('destocker');
                        shipSteps.delete('assembler');
                    }
                    else {
                        if (packSteps.has('destocker')) {
                            shipSteps.delete('assembler');
                            shipSteps.delete('stocker');
                        }
                        else {
                            shipSteps.delete('stocker');
                        }
                    }
                    return shipSteps;
                } },
            { name: 'à assembler', action: () => {
                    var nextSteps = new Set();
                    this.packs.forEach((pack) => {
                        pack.nextSteps().map((ste) => nextSteps.add(ste));
                    });
                    console.log('voici notre trouvaille');
                    return nextSteps;
                } }
        ];
    }
    créer() {
        return this.stateMachine.go('créer');
    }
    setPack(pack) {
        return this.stateMachine.go('setPack', { pack: pack });
    }
    update() {
        return this.stateMachine.go('update');
    }
    assembler() {
        return this.stateMachine.go('assembler');
    }
    étiqueter(transporteur) {
        return this.stateMachine.go('print');
    }
    charger() {
    }
    nextSteps() {
        var stateAction = this.statesAction.find((s) => s.name == this.stateMachine.state);
        if (!stateAction) {
            console.info('stateAction introuvable', this.stateMachine.state, this.statesAction);
            return [];
        }
        return Array.from(stateAction.action());
    }
}
;
export class Pack {
    constructor() {
        this.products = [];
        this.weight = 0;
        this.stateMachine = new StateMachine();
        this.stateMachine.state = 'init';
        this.stateMachine.events = ([
            { name: 'coliser', from: 'init', to: 'transit', conditions: [
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
                        return Promise.all(args.products.map(prod => prod.stateMachine.can('coliser', { pack: this }))).catch(() => Promise.reject("All the products are not packable"));
                    }
                ], actions: [
                    (args) => this.weight = parseFloat(args.weight),
                    (args) => this.products = args.products,
                    (args) => this.products.forEach(prod => prod.coliser(this))
                ] },
            { name: 'stocker', from: 'transit', to: 'stock', conditions: [], actions: [
                    (args) => {
                        this.place = args.place;
                    }
                ] },
            { name: 'destocker', from: 'stock', to: 'transit', conditions: [], actions: [
                    (args) => this.place = null
                ] },
            { name: 'assembler', from: 'transit', to: 'assemblé', conditions: [], actions: [] },
            { name: 'expedier', from: 'assemblé', to: 'terminé', conditions: [], actions: [] },
        ]);
        this.statesAction = [
            { name: 'init', action: () => {
                    return new Set(['coliser']);
                } },
            { name: 'transit', action: () => {
                    return new Set(['assembler', 'stocker']);
                } },
            { name: 'stock', action: () => {
                    return new Set(['destocker']);
                } }
        ];
    }
    coliser(weight, products) {
        console.log('voici products', products);
        return this.stateMachine.go('coliser', { weight: weight, products: products });
    }
    assembler() {
        return this.stateMachine.go('assembler');
    }
    stocker(place) {
        return this.stateMachine.go('stocker', { place: place });
    }
    destocker() {
        return this.stateMachine.go('destocker');
    }
    nextSteps() {
        var stateAction = this.statesAction.find((s) => s.name == this.stateMachine.state);
        if (!stateAction)
            return [];
        console.log("action : ", stateAction);
        return Array.from(stateAction.action());
    }
}
export class Product {
    constructor() {
        this.name = '';
        this.isExpected = true;
        this.stateMachine = new StateMachine();
        this.stateMachine.events = [
            { name: 'produire', from: 'init', to: 'available', conditions: [], actions: [] },
            { name: 'receptionner', from: 'available', to: 'receptionné', conditions: [], actions: [] },
            { name: 'coliser', from: 'receptionné', to: 'colisé', conditions: [
                    (args) => {
                        let pack = args.pack;
                        if (!pack)
                            return Promise.reject('No pack');
                        return Promise.resolve();
                    }
                ], actions: [
                    (args) => {
                        this.pack = args.pack;
                    }
                ] }
        ];
    }
    receptionner() {
        console.log('on receptionne');
        return this.stateMachine.go('receptionner');
    }
    coliser(pack) {
        console.log('colisage du produit avec le pack ', pack);
        return this.stateMachine.go('coliser', { pack: pack });
    }
    nextSteps() {
        var nextSteps = [];
        if (this.stateMachine.state == 'available')
            nextSteps = ["receptionner"];
        if (this.stateMachine.state == 'receptionné')
            nextSteps = ["coliser"];
        if (this.stateMachine.state == "colisé")
            nextSteps = [];
        if (this.stateMachine.state == 'init')
            nextSteps = ['produire'];
        return nextSteps;
    }
}
export class StateEvent {
    constructor() {
        this.conditions = [];
        this.actions = [];
    }
}
export class StateMachine {
    constructor() {
        this.state = 'init';
    }
    availableState() {
        return this.events.filter((s) => s.from == this.state);
    }
    nextState(event) {
        return this.availableState().filter((s) => s.name == event)[0];
    }
    possibleStates() {
        return new Promise((resolve, reject) => {
            let succeeds = [];
            let proms = this.availableState().map(state => this.can(state.name).then(() => succeeds.push(state.name), (x) => null));
            Promise.all(proms).then(() => resolve(succeeds));
        });
    }
    can(event, args = {}) {
        var nextState = this.nextState(event);
        if (!nextState)
            return Promise.reject("Invalid state. Available: " + this.availableState().map(x => x.name).join(', '));
        function every(tab) {
            return Promise.all(tab.map(f => f(args)));
        }
        return every(nextState.conditions).then(() => {
            return Promise.resolve((conditions, actions) => {
                return every(nextState.actions).then(() => this.state = nextState.to);
            });
        });
    }
    go(event, args = {}) {
        return this.can(event, args).then((f) => f());
    }
}
