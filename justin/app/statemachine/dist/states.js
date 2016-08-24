class Order {
    constructor() {
        this.shipments = [];
        this.name = 'SO0001';
        this.state = {};
    }
}
class Shipment {
    constructor() {
        this.packs = [];
        this.name = 'WH/OUT102';
        this.address = {};
        this.carrier = '';
        this.products = [];
        this.emplacement = {};
        this.stateMachine = new StateMachine();
        this.stateMachine.state = 'init';
        this.stateMachine.events = ([
            { name: 'créer', from: 'init', to: 'en attente', conditions: [], actions: [] },
            { name: 'setPack', from: 'en attente', to: 'en attente', conditions: [], actions: [] },
            { name: 'update', from: 'en attente', to: 'à assembler', conditions: [], actions: [] },
            { name: 'assembler', from: 'à assembler', to: 'assemblé', conditions: [], actions: [] },
            { name: 'étiqueter', from: 'assemblé', to: 'étiqueté', conditions: [], actions: [] },
            { name: 'charger', from: 'étiqueté', to: 'chargé', conditions: [], actions: [] },
        ]);
        var condActions = [
            { name: 'setPack', conditions: [], actions: [
                        (args) => {
                        let pack = args.pack;
                        if (this.packs.indexOf(pack) === -1)
                            this.packs.push(pack);
                    }
                ]
            },
            { name: 'update', conditions: [
                        () => {
                        if (!this.packs.length)
                            return Promise.reject('Pas de packs');
                    },
                        () => {
                        console.log('on check que tout soit bien colise');
                        if (!this.packs.every((pack) => pack.stateMachine.state === 'colisé'))
                            return Promise.reject('Tous les colis ne sont pas colisés');
                    },
                        () => {
                        console.log('on check que tous les produits soit colisés');
                        if (!this.products.every((product) => product.stateMachine.state === 'colisé'))
                            return Promise.reject('Tous les produits ne sont pas colisés');
                    }
                ], actions: []
            },
            { name: 'assembler', conditions: [
                        () => Promise.all(this.packs.map((p) => p.stateMachine.can('assembler')))
                ], actions: [
                        () => this.packs.forEach((p) => p.stateMachine.go('assembler'))
                ]
            },
            { name: 'étiqueter', conditions: [], actions: [
                        (transporteur) => { this.carrier = transporteur; }
                ]
            }
        ];
        this.statesAction = [
            { name: 'en attente', action: () => {
                    var nextStep = new Set();
                    function tousLesProduitsSontColisés(shipment) {
                        return shipment.products.every((product) => product.stateMachine.state == 'colisé');
                    }
                    if (tousLesProduitsSontColisés(this)) {
                        return nextStep.add("update");
                    }
                    else {
                        return nextStep.add("setPack");
                    }
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
        condActions.forEach((conda) => {
            let evt = this.stateMachine.events.find((e) => e.name == conda.name);
            evt.conditions = conda.conditions;
            evt.actions = conda.actions;
        });
        console.log('condaAction', this.stateMachine);
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
        return this.stateMachine.go('étiqueter');
    }
    charger() {
    }
    nextSteps() {
        var stateAction = this.statesAction.find((s) => s.name == this.stateMachine.state);
        if (!stateAction)
            return [];
        return Array.from(stateAction.action());
    }
}
;
class Pack {
    constructor() {
        this.products = [];
        this.name = 'PACK0001';
        this.weight = 0;
        this.locationSM = new StateMachine();
        this.locationSM.state = 'init';
        this.locationSM.events = ([
            { name: 'créer', from: 'init', to: 'transit', conditions: [], actions: [] },
            { name: 'stocker', from: 'transit', to: 'stock', conditions: [], actions: [] },
            { name: 'destocker', from: 'stock', to: 'transit', conditions: [], actions: [] },
            { name: 'assembler', from: 'transit', to: 'transit', conditions: [], actions: [] },
            { name: 'expedier', from: 'transit', to: 'terminé', conditions: [], actions: [] },
        ]);
        this.stateMachine = new StateMachine();
        this.stateMachine.state = 'init';
        this.stateMachine.events = ([
            { name: 'créer', from: 'init', to: 'created', conditions: [], actions: [] },
            { name: 'setWeight', from: 'created', to: 'created', conditions: [], actions: [] },
            { name: 'setProduct', from: 'created', to: 'created', conditions: [], actions: [] },
            { name: 'coliser', from: 'created', to: 'colisé', conditions: [], actions: [] },
            { name: 'assembler', from: 'colisé', to: 'assemblé', conditions: [], actions: [] },
        ]);
        var condActions = [
            { name: 'setProduct', conditions: [
                        (args) => {
                        let product = args.product;
                        if (product)
                            product.stateMachine.can('coliser');
                    }
                ], actions: [
                        (args) => {
                        let product = args.product;
                        product.coliser(this);
                    },
                        (args) => {
                        let product = args.product;
                        this.products.push(product);
                    }
                ] },
            { name: 'setWeight', conditions: [],
                actions: [
                        (args) => {
                        let weight = args.weight;
                        weight = parseInt(weight);
                        this.weight = weight;
                    }
                ] },
            { name: 'coliser', conditions: [
                        () => {
                        if (!this.weight)
                            return Promise.reject("pas de poids");
                    },
                        () => {
                        if (!this.products.length)
                            return Promise.reject('Pas de produits');
                    },
                        () => {
                        if (!this.products.every((p) => p.stateMachine.state == 'colisé'))
                            return Promise.reject("Tous les colis ne sont pas colisés");
                    }
                ], actions: [
                        () => this.locationSM.go('créer')
                ] },
            { name: 'assembler', conditions: [
                        () => this.locationSM.can('assembler'),
                ], actions: [] }
        ];
        this.statesAction = [
            { name: 'init', action: () => { return "créer"; } },
            { name: 'created', action: () => {
                    var steps = new Set();
                    if (!this.weight)
                        steps.add('setWeight');
                    if (!this.products.length)
                        steps.add('setProduct');
                    if (steps.size == 0)
                        steps.add('coliser');
                    return steps;
                } },
            { name: 'colisé', action: () => {
                    var steps = new Set();
                    if (this.locationSM.state == 'transit')
                        steps.add('assembler');
                    if (this.locationSM.state == 'stock')
                        steps.add('destocker');
                    return steps;
                } }
        ];
        condActions.forEach((conda) => {
            let evt = this.stateMachine.events.find((e) => e.name == conda.name);
            evt.conditions = conda.conditions;
            evt.actions = conda.actions;
        });
    }
    créer() {
        return this.stateMachine.go('créer');
    }
    setProduct(product) {
        return this.stateMachine.go('setProduct', { product: product });
    }
    setWeight(weight) {
        return this.stateMachine.go('setWeight', { weight: weight });
    }
    coliser() {
        console.log('dans le colisage', this);
        return this.stateMachine.go('coliser');
    }
    assembler() {
        return this.stateMachine.go('assembler');
    }
    stocker() {
        return this.locationSM.go('stocker');
    }
    destocker() {
        return this.locationSM.go('destocker');
    }
    nextSteps() {
        var stateAction = this.statesAction.find((s) => s.name == this.stateMachine.state);
        if (!stateAction)
            return [];
        console.log("action : ", stateAction);
        return Array.from(stateAction.action());
    }
}
class Product {
    constructor() {
        this.name = 'DEV-98083-23';
        this.order = 'SO0001';
        this.stateMachine = new StateMachine();
        this.stateMachine.events = [
            { name: 'receptionner', from: 'init', to: 'receptionné', conditions: [], actions: [] },
            { name: 'coliser', from: 'receptionné', to: 'colisé', conditions: [], actions: [] }
        ];
    }
    receptionner() {
        console.log('on receptionne');
        return this.stateMachine.go('receptionner');
    }
    coliser(pack) {
        console.log('colisage du produit avec le pack ', pack);
        var conditions = [
                () => {
                if (!pack)
                    return Promise.reject('No pack');
            }
        ];
        var actions = [
                () => this.pack = pack
        ];
        return this.stateMachine.can('coliser').then((f) => f(conditions, actions));
    }
    nextSteps() {
        var nextSteps = "";
        if (this.stateMachine.state == 'init')
            nextSteps = "receptionner";
        if (this.stateMachine.state == 'receptionné')
            nextSteps = "coliser";
        if (this.stateMachine.state == "colisé")
            nextSteps = null;
        return nextSteps;
    }
}
class StateEvent {
    constructor() {
        this.conditions = [];
        this.actions = [];
    }
}
class StateMachine {
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
            let proms = this.availableState().map(state => this.can(state.name).then(() => succeeds.push(state.name), (v) => console.log('oesf', v)));
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
