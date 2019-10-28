'use strict';
const utils = require('./misc.utils');

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
	    if(creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            storage = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: (struc)=>{
                return struc.store && struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }});
            if (storage.length > 0) {
                creep.transfer(storage[0], RESOURCE_ENERGY);
            }
        }
        utils.mine(creep);
	}
};