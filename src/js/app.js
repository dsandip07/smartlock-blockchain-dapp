App = {
  web3Provider: null,
  secondWeb3: null,
  contracts: {},

  init: function() {
    // Load properties
    $.getJSON('../properties.json', function(data) {
      var propsRow = $('#propsRow');
      var propTemplate = $('#propTemplate');

      for (i = 0; i < data.length; i ++) {
        propTemplate.find('.panel-title').text(data[i].address);
        propTemplate.find('img').attr('src', data[i].picture);
        propTemplate.find('.prop-address').text(data[i].address);
        propTemplate.find('.prop-age').text(data[i].age);
        propTemplate.find('.prop-area').text(data[i].area);
        propTemplate.find('.prop-rate').text(data[i].rate);
        propTemplate.find('.btn-pay').attr('data-id', data[i].id);
        propTemplate.find('.btn-unlock').attr('data-id', data[i].id);
        propsRow.append(propTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    }
    else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    App.secondWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('AssetLease.json', function(data) {
      var AssetLeaseArtifact = data;
      App.contracts.AssetLease = TruffleContract(AssetLeaseArtifact);
      App.contracts.AssetLease.setProvider(App.web3Provider);
      return App.loadAssets();
    });
    
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-pay', App.handlePay);
    $(document).on('click', '.btn-unlock', App.handleUnlock);
  },

  loadAssets: function() { 
    App.contracts.AssetLease.deployed().then(function(instance) { 
      return instance.getStates.call();
    }).then(function(states) {
      for (i = 0; i < states.length; i++) {
        if (states[i] == 0) {
          $('.panel-prop').eq(i).find('.btn-unlock').text('Locked').attr('disabled', true);
        } else if (states[i] == 1) {
          $('.panel-prop').eq(i).find('.btn-pay').text('Rent paid').attr('disabled', true);
        } else {
          $('.panel-prop').eq(i).find('.btn-pay').text('Rent paid').attr('disabled', true);
          $('.panel-prop').eq(i).find('.btn-unlock').text('Unlocked').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  setStatus: function(message) {
    $('.duration-input span').html(message);
  },

  makeRequest: function(endPoint) {
    $.ajax({
      type: "GET",
      dataType: "jsonp",
      url: endPoint,
      success: function(data) {
        console.log('REST API response: ' + data.status);
      }
    });
  },


  handlePay: function(event) {
    event.preventDefault();
    App.setStatus('');
    var assetId = parseInt($(event.target).data('id'));
    var days = parseInt($('.panel-prop').eq(assetId).find('.prop-days').val());

    if (isNaN(days) || days < 1) {
      App.setStatus('[InvalidDuration] Input <b>valid</b> lease duration in days');
      return;
    }

    var rate = parseInt($('.panel-prop').eq(assetId).find('.prop-rate').text());
    var rent = rate * days * 10 * 10 * 10 * 10 * 10 * 10 * 10 * 10 * 10; 

    var ownerAccount;
    var tenantAccount; 

    App.secondWeb3.eth.getAccounts(function (e, accts){
      ownerAccount = accts[1];
    });

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      
      tenantAccount = accounts[0];

      App.contracts.AssetLease.deployed().then(function(instance) {
        return instance.payRent(ownerAccount, assetId, {from: tenantAccount, value: rent, gas: 500000});
      }).then(function(result) {
        for (var i=0; i < result.logs.length; i++) {
          var log = result.logs[i];
          if (log.event == 'RentPaid') {
            App.setStatus('[RentPaid] <b>' + log.args.tenant + '</b> paid <b>' + log.args.rent + '</b> wei to <b>' + log.args.owner + '</b>');
            $('.panel-prop').eq(assetId).find('.btn-pay').text('Rent paid').attr('disabled', true);
            $('.panel-prop').eq(assetId).find('.btn-unlock').text('Unlock').attr('disabled', false);
            $('.panel-prop').eq(assetId).find('.prop-days').attr('disabled', true);
            break; 
          }
        }
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleUnlock: function(event) {
    event.preventDefault();
    App.setStatus('');
    var assetId = parseInt($(event.target).data('id')); 
    var days = parseInt($('.panel-prop').eq(assetId).find('.prop-days').val());
    var assetDetails = $('.panel-prop').eq(assetId).find('.prop-address').text();
    var ownerAccount;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      ownerAccount = accounts[0];
    
      App.contracts.AssetLease.deployed().then(function(instance) {
        return instance.unlockAsset(assetId, {from: ownerAccount, gas: 500000});
      }).then(function(result) {
        for (var i=0; i < result.logs.length; i++) {
          var log = result.logs[i];
          if (log.event == 'AssetUnlocked') {
            App.setStatus('[AssetUnlocked] <b>' + log.args.owner + '</b> unlocked asset <b>' + assetDetails + '</b>');
            App.makeRequest("http://10.88.213.203:5000/smartlock/api/v1.0/unlock");
            $('.panel-prop').eq(assetId).find('.btn-pay').text('Rent paid').attr('disabled', true);
            $('.panel-prop').eq(assetId).find('.btn-unlock').text('Unlocked').attr('disabled', true);
            setTimeout(App.handleLock, days * 1000, assetId);
            break; 
          }
        }
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleLock: function(assetId) {
    App.setStatus(''); 
    var days = parseInt($('.panel-prop').eq(assetId).find('.prop-days').val());
    var assetDetails = $('.panel-prop').eq(assetId).find('.prop-address').text();
    var ownerAccount;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      ownerAccount = accounts[0];
    
      App.contracts.AssetLease.deployed().then(function(instance) {
        return instance.lockAsset(assetId, {from: ownerAccount, gas: 500000});
      }).then(function(result) {
        for (var i=0; i < result.logs.length; i++) {
          var log = result.logs[i];
          if (log.event == 'AssetLocked') {
            App.setStatus('[AssetLocked] <b>' + days + '</b> days over. <b>' + log.args.owner + '</b> locked asset <b>' + assetDetails + '</b>');
            App.makeRequest("http://10.88.213.203:5000/smartlock/api/v1.0/lock");
            $('.panel-prop').eq(assetId).find('.btn-pay').text('Pay rent').attr('disabled', false);
            $('.panel-prop').eq(assetId).find('.btn-unlock').text('Locked').attr('disabled', true);
            $('.panel-prop').eq(assetId).find('.prop-days').attr('disabled', false);
            break; 
          }
        }
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },



};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
