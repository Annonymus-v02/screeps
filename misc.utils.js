'use strict';

module.exports = {
    /** @param {Creep} creep **/
    mine: function(creep) {
        let sources = creep.room.find(FIND_SOURCES);
        if(creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    },
    /** @param {Creep} creep **/
    upgradeController: function(creep) {
        if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    },
    /** @param {Creep} creep **/
    storeEnergy: function(creep) {
        let stores = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (struc) => {
                return [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].includes(struc.structureType) && struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if (stores.length > 0) {
            if(creep.transfer(stores[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(stores[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        } else {
            return false;
        }
    },
    /** @param {Creep} creep **/
    gatherEnergy: function(creep) {
        let sources = creep.room.find(FIND_DROPPED_RESOURCES);
        if (sources.length === 0) return false;
        if(creep.pickup(sources[0]) === ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep **/
    getEnergy: function(creep) {
        if(!this.gatherEnergy(creep)) {
            this.mine(creep);
        }
    },
};