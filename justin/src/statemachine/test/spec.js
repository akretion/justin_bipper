"use strict";

var Product = states.Product;
var Pack = states.Pack;
var Shipment = states.Shipment;

function shouldFail(...a) {
  console.log('fail with a', a);
  expect(true).toBe(false);
}
function shouldSucceed(...a) {
  console.log('succeed with a', a);
  expect(true).toBe(true);
}
describe('Product', () => {
  var p;
  beforeEach(() => {
    p = new Product();
    p.stateMachine.state = 'available';
  }
)
  it ('should init state', () => {
    p = new Product();
    expect(p.stateMachine.state).toEqual('init');
    //on produit a la mano
  });
  it ('should receptionner first', (done) => {
    let prom = p.receptionner();
    prom.then(
      () => expect(p.stateMachine.state).toEqual('receptionné')
    ).then(done);
  });
  it ('should not receptionner twice', (done) => {
    p.receptionner().then( () => {
      p.receptionner().then(shouldFail, shouldSucceed).then(done);
    });
  });
});

describe('Pack', () => {
  var prod, pack;
  describe('base', () => {
    beforeEach( () => {
      prod = new Product();
      prod.stateMachine.state = 'available';
      pack = new Pack();
    });

    it ('should coliser sans problemes', (done) => {
      Promise.resolve().then(
        () => prod.receptionner()
      ).then(
        () => pack.créer()
      ).then(
        () => pack.coliser(8, [prod])
      ).then(shouldSucceed, shouldFail).then(done);
    });

    it ('should not coliser sans produits', (done) => {
      Promise.resolve().then(
        () => pack.créer()
      ).then(
        () => pack.coliser(8, [])
      ).then(shouldFail, shouldSucceed).then(done);
    });

    it ('should not coliser sans poids', (done) => {
      Promise.resolve().then(
        () => pack.créer()
      ).then(
        () => p.receptionner()
      ).then(
        () => pack.coliser("", p)
      ).then(shouldFail, shouldSucceed).then(done);
    });
  });

  describe('autre', () => {
    var p1;
    var p2;
    var pack;
    var ready;
    beforeEach( () => {
      p1 = new Product();
      p1.stateMachine.state = 'available';
      p2 = new Product();
      p2.stateMachine.state = 'available';
      pack = new Pack();
      ready = Promise.all([pack.créer(), p1.receptionner(), p2.receptionner()]);
      console.log('dans beforeEach', ready);
    });
    it ('should not assemble from stock', (done) => {
      ready.then(
        () => pack.coliser(8, [p1, p2])
      ).then(
        () => pack.stocker()
      ).then(
        () => expect(pack.locationSM.state).toEqual('stock')
      ).then(
        () => pack.assembler()
      ).then(shouldFail, shouldSucceed).then(done);
    });
    it ('should assemble after stock', (done) => {
      ready.then(
        () => expect(pack.locationSM.state).toEqual('init')
      ).then(
        () => pack.coliser(8, [p1,p2])
      ).then(
        () => expect(pack.locationSM.state).toEqual('transit')
      ).then(
        () => pack.stocker()
      ).then(
        () => expect(pack.locationSM.state).toEqual('stock')
      ).then(
        () => pack.destocker()
      ).then(
        () => expect(pack.locationSM.state).toEqual('transit')
      ).then(
        () => pack.assembler()
      ).then(shouldSucceed, shouldFail).then(done);
    });
    it ('should handle weight as string', (done) => {
      ready.then(
        () => pack.coliser("4", [p1])
      ).then(
        () => expect(pack.weight).toEqual(4)
      ).then(shouldSucceed, shouldFail).then(done);
    });
    it ('should reject negative weight', (done) => {
      ready.then(
        () => pack.coliser("-4", [p1])
      ).then(
        () => expect(pack.weight).toEqual(4)
      ).then(shouldFail, shouldSucceed).then(done);
    });
    it ('should tell us possible steps', (done) => {
      ready.then(
        () => pack.coliser(7, [p1])
      ).then(
        () => pack.stocker()
      ).then(
        () => pack.stateMachine.possibleStates()
      ).then(
        (av) => expect(av.length).toEqual(0)
      ).then(
        () => pack.locationSM.possibleStates()
      ).then(
        (av) => expect(av).toContain('destocker')
      ).then(shouldSucceed, shouldFail).then(done);
    });

    it ('should tell us next steps directly 0', (done) => {
      ready.then(
        () => pack.nextSteps()
      ).then(
        (nextSteps) => {
          expect(nextSteps).toContain('coliser')
        }
      ).then(
        () => pack.coliser(8, [p1, p2])
      ).then(
        () => pack.nextSteps()
      ).then(
        (nextSteps) => {
          expect(nextSteps).toContain('assembler')
        }
      ).then(
        () => pack.stocker()
      ).then(
        () => pack.nextSteps()
      ).then(
        (nextSteps) => {
          expect(nextSteps).toContain('destocker')
        }
      ).then(shouldSucceed, shouldFail).then(done);
    });

    it ('should tell us next steps directly 1', (done) => {
      ready.then(
        () => pack.coliser(7, [p1,p2])
      ).then(
        () => pack.nextSteps()
      ).then(
        (nextSteps) => {
          console.log('voila nextSteps', nextSteps);
          expect(nextSteps).toContain('assembler')
        }
      ).then(shouldSucceed, shouldFail).then(done);
    });
    it ('should tell us next steps directly 2', (done) => {
      ready.then(
        () => pack.coliser(8, [p1,p2])
      ).then(
        () => pack.stocker()
      ).then(
        () => pack.nextSteps()
      ).then(
        (nextSteps) => expect(nextSteps).toContain('destocker')
      ).then(shouldSucceed, shouldFail).then(done);
    });
  });
});

describe('Shipment', () => {
  describe('autre', () => {
    var p1;
    var p2;
    var shipment;
    var ready;
    beforeEach( () => {
      p1 = new Product();
      p1.stateMachine.state = 'available';
      p2 = new Product();
      p2.stateMachine.state = 'available';
      shipment = new Shipment();
      console.log(shipment.créer);
      ready = shipment.créer().then(
        () => Promise.all([p1.receptionner(), p2.receptionner()])
      ).then(
        () => shipment.products.push(p1, p2)
      ).then(
        () => console.log('on est ready')
      )
      console.log('dans beforeEach', ready);
    });

    it ('2 products in shipment', (done) => {
      ready.then(
        () => expect(shipment.products.length).toEqual(2)
      ).then(done);
    });
    it ('should setPack', (done) => {
      let pack = new Pack();

      ready.then(
        () => pack.créer()
      ).then(
        () => pack.coliser(3, [shipment.products[0]])
      ).then(
        () => shipment.setPack(pack)
      ).then(
        () => expect(shipment.packs.indexOf(pack) !== -1).toBe(true)
      ).then(shouldSucceed, shouldFail).then(done);
    });
    it ('should have products from the same shipment in the packs', (done) => {
      let newShip = new Shipment();
      let pack = new Pack();
      let p3 = new Product();
      p3.stateMachine.state = 'available';
      p3.shipment = newShip;
      ready.then(
        () => pack.créer()
      ).then(
        () => p3.receptionner()
      ).then(
        () => pack.coliser(4, [p3, p2])
      ).then(shouldFail, shouldSucceed)
      .then(done)
    });
    it ('should let us know available states', (done) => {
      ready.then(
        () => shipment.stateMachine.possibleStates()
      ).then(
        (availableStates) => {
          expect(availableStates).toContain('setPack');
          console.log(availableStates);
        }
      ).then(shouldSucceed, shouldFail).then(done)
    });
    it ('should let us know available states for repuriaperaa', (done) => {
      var pack= new Pack();
      ready.then(
        () => pack.créer()
      ).then(
        () => {
          p1.shipment = shipment;
          p2.shipment = shipment;
          return Promise.all([
            pack.coliser(3, [p1,p2]),
            shipment.setPack(pack),
          ]);
        }
      ).then(
        () => shipment.nextSteps()
      ).then(
        (nextStates) => {
          console.log('voila les nextstesp', nextStates);
          expect(nextStates).toContain('assembler');
          expect(nextStates.length).toEqual(1);
        }
      ).then(
        () => shipment.update()
      ).then(
        () => shipment.nextSteps()
      ).then(
        (nextStates) => {
          console.log('voila les nextstesp', nextStates);
          expect(nextStates).toContain('assembler');
          expect(nextStates.length).toEqual(1);
        }
      ).then(shouldSucceed, shouldFail).then(done)
    });
  });
});
