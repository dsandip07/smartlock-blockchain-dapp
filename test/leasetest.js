var AssetLease = artifacts.require('AssetLease');

contract('AssetLease', function(accounts) {

  it("Initial: Asset 2 state should be locked", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getStates.call();
    }).then(function(value) {
      assert.equal(value[2], 0, "Asset 2 state is not locked");
    });
  });
  
  it("Initial: Asset 2 should be unoccupied now", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getTenants.call();
    }).then(function(value) {
      assert.equal(value[2], '0x0000000000000000000000000000000000000000', "Asset 2 is not unoocupied");
    });
  });

  it("Rent transfer should happen", function() {
    return AssetLease.deployed().then(function(instance) {
      console.log ('Before Balances: ' + web3.eth.getBalance(accounts[0]) + " - " + web3.eth.getBalance(accounts[1]));
      return instance.payRent(accounts[1], 2, {from: accounts[0], value: 30000});
    }).then(function(result) {
      for (var i=0; i < result.logs.length; i++) {
        var log = result.logs[i];
        if (log.event == 'RentPaid') {
          console.log ('RentPaid event was emitted: Tenant - ' + log.args.tenant + ' Owner - ' + log.args.owner + ' Rent - ' + log.args.rent);
          console.log ('After Balances: ' + web3.eth.getBalance(accounts[0]) + " - " + web3.eth.getBalance(accounts[1]));
          break;
        }
      }

    }).catch (function(err) {
      console.log ('Error: ' + err);
    });
  });

  it("Asset 2 state should be RentPaid", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getStates.call();
    }).then(function(value) {
      assert.equal(value[2], 1, "Asset 2 state is not RentPaid");
    });
  });

  it("Asset 2 should be occupied", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getTenants.call();
    }).then(function(value) {
      assert.equal(value[2], accounts[0], "Asset 2 is not occupied");
    });
  });


  it("Unlocking of asset should happen", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.unlockAsset(2, {from: accounts[1]});
    }).then(function(result) {
      for (var i=0; i < result.logs.length; i++) {
        var log = result.logs[i];
        if (log.event == 'AssetUnlocked') {
          console.log ('AssetUnlocked event was emitted: Owner - ' + log.args.owner + ' Asset ID - ' + log.args.assetId);
          break;
        }
      }

    }).catch (function(err) {
      console.log ('Error: ' + err);
    });
  });

  it("Asset 2 state should be Unlocked", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getStates.call();
    }).then(function(value) {
      assert.equal(value[2], 2, "Asset 2 state is not Unlocked");
    });
  });
  
  it("Asset 2 should be occupied", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getTenants.call();
    }).then(function(value) {
      assert.equal(value[2], accounts[0], "Asset 2 is not occupied");
    });
  });


  it("Locking of asset should happen", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.lockAsset(2, {from: accounts[1]});
    }).then(function(result) {
      for (var i=0; i < result.logs.length; i++) {
        var log = result.logs[i];
        if (log.event == 'AssetLocked') {
          console.log ('AssetLocked event was emitted: Owner - ' + log.args.owner + ' Asset ID - ' + log.args.assetId);
          break;
        }
      }

    }).catch (function(err) {
      console.log ('Error: ' + err);
    });
  });

  it("Asset 2 state should be locked", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getState.call(2);
    }).then(function(value) {
      assert.equal(value, 0, "Asset 2 state is not locked");
    });
  });
  
  it("Asset 2 should be unoccupied now", function() {
    return AssetLease.deployed().then(function(instance) {
      return instance.getTenants.call();
    }).then(function(value) {
      assert.equal(value[2], '0x0000000000000000000000000000000000000000', "Asset 2 is not unoocupied");
    });
  });
  

});
