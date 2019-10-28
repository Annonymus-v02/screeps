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
    salvageEnergy: function(creep) {
        let sources = creep.room.find(FIND_RUINS, {filter: struc=>{
            return struc.store && struc.store[RESOURCE_ENERGY] > 0;
            }});
        if (sources.length === 0) return false;
        // noinspection JSCheckFunctionSignatures
        if(creep.withdraw(sources[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep
     * @param {Boolean} ifExistsBetter - if true, creep will only withdraw energy if there is a more useful place for it*/
    gatherUselessEnergy: function(creep, ifExistsBetter = false)  {
        let usefulStores = ifExistsBetter ? creep.room.find(FIND_MY_STRUCTURES, {
            filter: (struc) => {
                return [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].includes(struc.structureType)
                    && struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        }) : [];
        let uselessStores = creep.room.find(FIND_STRUCTURES, {
            filter: (struc) => {
                return [STRUCTURE_STORAGE, STRUCTURE_CONTAINER].includes(struc.structureType)
                    && struc.store[RESOURCE_ENERGY] > 0;
            }
        });
        if (usefulStores.length > 0 && uselessStores.length > 0) {
            if(creep.withdraw(uselessStores[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(uselessStores[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        }
        return false;
    },
    /** @param {Creep} creep
     * @param {Boolean} fromRuins **/
    getEnergy: function(creep, fromRuins = false) {
        if (fromRuins && this.salvageEnergy(creep)) return;
        if(!this.gatherEnergy(creep)) {
            //this.mine(creep);
        }
    },
    /** @param {Room} room */
    getSources: function(room) {
        let mem = room.memory;
        if (mem && mem.sources && mem.sources.v === 1) {
            return mem.sources;
        } else {
            mem.sources = {};
            mem.sources.v = 1;
            let sources = room.find(FIND_SOURCES);
            for (let sourcei in sources) {
                if (!sources.hasOwnProperty(sourcei)) continue;
                let source = sources[sourcei];
                mem.sources[sourcei] = {};
                mem.sources[sourcei].spots = 0;
                mem.sources[sourcei].id = source.id;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1 ; j <= 1; j++) {
                        if (i || j) {
                            if (!PathFinder.search(
                                source.pos,
                                new RoomPosition(source.pos.x + i, source.pos.y + j, source.room.name),
                                {maxOps: 10, maxRooms: 1, maxCost: 20})
                                .incomplete) {
                                mem.sources[sourcei].spots++;
                            }
                        }
                    }
                }
            }
        }
    },
};