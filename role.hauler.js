'use strict';
const utils = require('./misc.utils');

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.gathering && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.gathering = true;
            creep.say('\u{26CF}\uFE0F get');
        }
        if(creep.memory.gathering && creep.store.getFreeCapacity() === 0) {
            creep.memory.gathering = false;
            creep.say('\u{1F4E6} store');
        }

        if(creep.memory.gathering) {
            if(!utils.gatherEnergy(creep) && !utils.salvageEnergy(creep)) {
                utils.gatherUselessEnergy(creep, true);
            }
        } else {
            if (!utils.storeEnergy(creep)) {
                console.log('I should be upgrading');
                utils.upgradeController(creep);
            }
        }
    }
};
