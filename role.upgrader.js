'use strict';

const utils = require('misc.utils');

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('\u{26CF} mine');
	    }
	    if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
	        creep.memory.upgrading = true;
	        creep.say('\u{2B06} upgrade');
	    }
	    
        if (!creep.memory.upgrading) {
            utils.mine(creep);
        } else {
            utils.upgradeController(creep);
        }
	}
};