'use strict';
const utils = require('./misc.utils');

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep){

        if(creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('\u{26CF} mine');
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() === 0) {
	        creep.memory.building = true;
	        creep.say('\u{1F528} build');
	    }
        
        if (!creep.memory.building) {
            utils.mine(creep);
        } else {
            let sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (sites.length !== 0) {
                if (creep.build(sites[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0]);
                }
            } else {
                if (!utils.storeEnergy(creep)) {
                    utils.upgradeController(creep);
                }
            }
        }
    }
};