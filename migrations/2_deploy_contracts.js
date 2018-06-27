var AssetLease = artifacts.require('AssetLease');

module.exports = function(deployer) {
    deployer.deploy(AssetLease);
}