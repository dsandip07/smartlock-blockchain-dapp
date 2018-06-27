pragma solidity ^0.4.17;


contract AssetLease {
    enum State {Locked, RentPaid, Unlocked}
    State[4] public states;
    address[4] public tenants;

    event RentPaid (address tenant, address owner, uint rent);
    event AssetUnlocked (address owner, uint assetId);
    event AssetLocked (address owner, uint assetId);
    
    function payRent(address owner, uint assetId) public payable {
        require (assetId >= 0 && assetId <= 3);
        uint rent = msg.value;
        tenants[assetId] = msg.sender;
        states[assetId] = State.RentPaid;
        owner.transfer(rent);
        emit RentPaid (msg.sender, owner, rent);
    }

    function unlockAsset(uint assetId) public {
        emit AssetUnlocked (msg.sender, assetId);
        states[assetId] = State.Unlocked;
    }

    function lockAsset(uint assetId) public {
        emit AssetLocked (msg.sender, assetId);
        states[assetId] = State.Locked;
        tenants[assetId] = 0x0000000000000000000000000000000000000000;
    }

    function getTenants() public view returns(address[4]) {
        return tenants; 
    }

    function getStates() public view returns(State[4]) {
        return states;
    }

    function getState(uint assetId) public view returns(State) {
        return states[assetId];
    }
}