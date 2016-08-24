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
        this.state = {};
        this.stateMachine = new StateMachine();
        this.stateMachine.state = 'init';
        this.stateMachine.events = ([
            { name: 'créer', from: 'init', to: 'en attente' },
            { name: 'setPack', from: 'en attente', to: 'en attente' },
            { name: 'update', from: 'en attente', to: 'à assembler' },
            { name: 'assembler', from: 'à assembler', to: 'assemblé' },
            { name: 'étiqueter', from: 'assemblé', to: 'étiqueté' },
            { name: 'charger', from: 'étiqueté', to: 'chargé' },
        ]);
    }
    créer() {
        return this.stateMachine.go('créer');
    }
    setPack(pack) {
        var conditions = [];
        var actions = [
                () => {
                if (this.packs.indexOf(pack) === -1)
                    this.packs.push(pack);
            }
        ];
        return this.stateMachine.can('setPack').then((f) => f(conditions, actions));
    }
    update() {
        var conditions = [
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
        ];
        var actions = [];
        return this.stateMachine.can('update').then((f) => {
            return f(conditions, actions);
        });
    }
    assembler() {
        var conditions = [
                () => Promise.all(this.packs.map((p) => p.stateMachine.can('assembler')))
        ];
        var actions = [
                () => this.packs.forEach((p) => p.stateMachine.go('assembler'))
        ];
        return this.stateMachine.can('assembler').then((f) => f(conditions, actions));
    }
    étiqueter(transporteur) {
        var conditions = [];
        var actions = [
                () => { this.carrier = transporteur; }
        ];
        return this.stateMachine.can('étiqueter').then((f) => f(conditions, actions));
    }
    charger() {
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
            { name: 'créer', from: 'init', to: 'transit' },
            { name: 'stocker', from: 'transit', to: 'stock' },
            { name: 'destocker', from: 'stock', to: 'transit' },
            { name: 'assembler', from: 'transit', to: 'transit' },
            { name: 'expedier', from: 'transit', to: 'terminé' },
        ]);
        this.stateMachine = new StateMachine();
        this.stateMachine.state = 'init';
        this.stateMachine.events = ([
            { name: 'créer', from: 'init', to: 'created' },
            { name: 'setWeight', from: 'created', to: 'created' },
            { name: 'setProduct', from: 'created', to: 'created' },
            { name: 'coliser', from: 'created', to: 'colisé' },
            { name: 'assembler', from: 'colisé', to: 'assemblé' },
        ]);
    }
    créer() {
        return this.stateMachine.go('créer');
    }
    setProduct(product) {
        var conditions = [
                () => product.stateMachine.can('coliser')
        ];
        var actions = [
                () => {
                console.log('onva coliser');
                product.coliser(this);
            },
                () => this.products.push(product)
        ];
        return this.stateMachine.can('setProduct').then((f) => f(conditions, actions));
    }
    setWeight(weight) {
        weight = parseInt(weight);
        var conditions = [];
        var actions = [() => this.weight = weight];
        return this.stateMachine.can('setWeight').then((f) => f(conditions, actions));
    }
    coliser() {
        console.log('dans le colisage', this);
        var conditions = [
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
        ];
        var actions = [
                () => {
                this.locationSM.go('créer');
            },
                () => {
                true;
            }
        ];
        return this.stateMachine.can('coliser').then((f) => f(conditions, actions));
    }
    assembler() {
        let conditions = [
                () => this.locationSM.can('assembler'),
        ];
        let actions = [];
        return this.stateMachine.can('assembler').then((f) => f(conditions, actions));
    }
    stocker() {
        return this.locationSM.go('stocker');
    }
    destocker() {
        return this.locationSM.go('destocker');
    }
}
class Product {
    constructor() {
        this.name = 'DEV-98083-23';
        this.order = 'SO0001';
        this.stateMachine = new StateMachine();
        this.stateMachine.events = [
            { name: 'receptionner', from: 'init', to: 'receptionné' },
            { name: 'coliser', from: 'receptionné', to: 'colisé' }
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
}
class StateEvent {
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
    can(event) {
        var nextState = this.nextState(event);
        if (!nextState)
            return Promise.reject("Invalid state. Available: " + this.availableState().map(x => x.name).join(', '));
        return Promise.resolve((conditions, actions) => {
            function every(tab) {
                return Promise.all(tab.map(f => f(self)));
            }
            return every(conditions).then(() => every(actions)).then(() => this.state = nextState.to);
        });
    }
    go(event) {
        var conditions = [];
        var actions = [() => { this.state = this.nextState(event).to; }];
        return this.can(event).then((f) => f(conditions, actions));
    }
}
