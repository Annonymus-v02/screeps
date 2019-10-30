'use strict';

module.exports = {
    /** @param {Creep} creep **/
    mine: function(creep) {
        // let sources = creep.room.find(FIND_SOURCES);
        // if(creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
        //     creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        // }
        if (!creep.memory.source) {
            let sources = this.getSources(creep.room);

            for (let source in sources) {
                if (!sources.hasOwnProperty(source)) continue;
                if (sources[source].spots > sources[source].used) {
                    creep.memory.source = source;
                    sources[source].used++;
                    break;
                }
            }
            if (!creep.memory.source) {
                this.err('creep could not find available source');
                return;
            }
        }
        if(creep.harvest(Game.getObjectById(creep.memory.source)) === ERR_NOT_IN_RANGE) {
            creep.moveTo(Game.getObjectById(creep.memory.source), {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    },
    /** @param {Creep} creep **/
    mineManual: function(creep) {
        let source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    },
    /** @param {Creep} creep **/
    upgradeController: function(creep) {
        if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    },
    /** @param {Creep} creep **/
    repair: function(creep) {
        let damaged = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struc)=>{
                return (struc.my
                    || [STRUCTURE_WALL, STRUCTURE_CONTAINER, STRUCTURE_ROAD].includes(struc.structureType))
                    && struc.hits < struc.hitsMax;
            }});
        if (!damaged) return false;
        if(creep.repair(damaged) === ERR_NOT_IN_RANGE) {
            creep.moveTo(damaged, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep **/
    storeEnergy: function(creep) {
        // TODO: work in layers
        let store = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (struc) => {
                // TODO: eventually add storage and containers here
                return [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].includes(struc.structureType) && struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if (store) {
            if(creep.transfer(store, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(store, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        } else {
            return false;
        }
    },
    /** @param {Creep} creep **/
    gatherEnergy: function(creep) {
        let source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
        if (source === null) return false;
        if(creep.pickup(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep **/
    salvageEnergy: function(creep) {
        // TODO: FIND_STRUCTURES and filter for ruins/tombstones
        let source = creep.pos.findClosestByPath(FIND_RUINS, {filter: struc=>{
            return struc.store && struc.store[RESOURCE_ENERGY] > 0;
            }});
        if (source === null) return false;
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
        let uselessStore = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (struc) => {
                return [STRUCTURE_STORAGE, STRUCTURE_CONTAINER].includes(struc.structureType)
                    && struc.store[RESOURCE_ENERGY] > 0;
            }
        });
        if (usefulStores.length > 0 && uselessStore !== null) {
            if(creep.withdraw(uselessStore, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(uselessStore, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        }
        return false;
    },
    /** @param {Creep} creep
     * @param {Boolean} fromRuins **/
    getEnergy: function(creep, fromRuins = false) {
        // let hasHarvester = false;
        // for (let creep in Game.creeps) {
        //     if (Game.creeps[creep].memory.role === 'harvester'){
        //         hasHarvester = true;
        //         break;
        //     }
        // }
        // if(!hasHarvester){
        //     let source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        //     if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
        //         creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        //     }
        // }
        if (fromRuins && this.salvageEnergy(creep)) return;
        if(!this.gatherEnergy(creep)) {
            // TODO: stop mining and have the harvesters reserve a spot on their source.
            // Also when a creep dies, unregister their spot (while deleting memory)
            this.mineManual(creep);
        }
    },
    /** @param {Room} room */
    getSources: function(room) {
        let mem = room.memory;
        if (mem && mem.sources && mem.sources.v === 4) {
            return mem.sources;
        } else {
            mem.sources = {};
            mem.sources.v = 4;
            let sources = room.find(FIND_SOURCES);
            for (let sourcei in sources) {
                if (!sources.hasOwnProperty(sourcei)) continue;
                let source = sources[sourcei];
                mem.sources[source.id] = {};
                mem.sources[source.id].spots = 0;
                mem.sources[source.id].used = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1 ; j <= 1; j++) {
                        if (i || j) {
                            if (!PathFinder.search(
                                source.pos,
                                new RoomPosition(source.pos.x + i, source.pos.y + j, source.room.name),
                                {maxOps: 10, maxRooms: 1, maxCost: 20})
                                .incomplete) {
                                mem.sources[source.id].spots++;
                            }
                        }
                    }
                }
            }
            return mem.sources;
        }
    },

    err: function(message) {
        console.log(message);
        Game.notify(message, 10);
    }
};