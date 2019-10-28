'use strict';
const utils = require('./misc.utils');

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.mining && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.mining = true;
            creep.say('\u{26CF}\uFE0F mine');
	    }
	    if(creep.memory.mining && creep.store.getFreeCapacity() === 0) {
	        creep.memory.mining = false;
	        creep.say('\u{1F4E6} store');
	    }
        
	    if(creep.memory.mining) {
            utils.getEnergy(creep);
        }
        else if(!utils.storeEnergy(creep)) {
            utils.upgradeController(creep);
        }
	}
};

// module.exports = roleHarvester;