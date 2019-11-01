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
        let res = creep.harvest(Game.getObjectById(creep.memory.source));
        if(res === ERR_NOT_IN_RANGE || res ===  ERR_NOT_ENOUGH_RESOURCES) {
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
    /** @param {Creep | StructureTower} agent
     * @param layer - internal value, do not set
     */
    repair: function(agent, layer = 0) {
        let what;
        let maxRepair = Infinity;
        switch (layer) {
            case 0: what = [STRUCTURE_CONTAINER, STRUCTURE_ROAD]; break;
            case 1: what = [STRUCTURE_WALL]; maxRepair = 5000000; break;
            case 3: what = [STRUCTURE_WALL]; break;
            default:
                this.err('repair called with invalid layer');
                what = [STRUCTURE_CONTAINER, STRUCTURE_ROAD];
        }
        let damaged = agent.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struc)=>{
                return (struc.my
                    || what.includes(struc.structureType))
                    && struc.hits < struc.hitsMax
                    && struc.hits < 5000000;
            }});
        if (!damaged) return layer < 1 ? this.repair(agent, layer + 1) : false;
        if(agent.repair(damaged) === ERR_NOT_IN_RANGE) {
            agent.moveTo(damaged, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep *
     * @param layer - internal value, do not set
     */
    storeEnergy: function(creep, layer = 0) {
        let from;
        switch (layer) {
            case 0: from = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION]; break;
            case 1: from = [STRUCTURE_TOWER]; break;
            case 2: from = [STRUCTURE_STORAGE]; break;
            default:
                this.err('storeEnergy called with invalid layer');
                from = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION];
        }
        let store = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (struc) => {
                return from.includes(struc.structureType)
                    && struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    && !struc.reserved;
            }
        });
        if (store) {
            store.reserved = true;
            if(creep.transfer(store, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(store, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        } else {
            return layer < 2 ? this.storeEnergy(creep, layer + 1) : false;
        }
    },
    /** @param {Creep} creep **/
    gatherEnergy: function(creep) {
        let source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: energy=>{
            return !energy.reserved;
            }});
        if (source === null) return this.takeEnergy;
        source.reserved = true;
        if(creep.pickup(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep **/
    takeEnergy: function(creep) {
        let harvester = creep.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (harvester) => {
            return harvester.memory.role === 'harvester'
                && harvester.store[RESOURCE_ENERGY] > 0
                && !harvester.reserved;
            }});
        if (harvester === null) return false;
        harvester.reserved = true;
        if(harvester.transfer(creep, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(harvester, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep *
     * @param layer - internal value, do not set
     */
    salvageEnergy: function(creep, layer = 0) {
        let from;
        switch (layer) {
            case 0: from = FIND_RUINS; break;
            case 1: from = FIND_TOMBSTONES; break;
            default:
                this.err('salvageEnergy called with invalid layer');
                from = FIND_RUINS;
        }
        let source = creep.pos.findClosestByPath(from, {filter: struc=>{
            return struc.store
                && struc.store[RESOURCE_ENERGY] > 0
                && !struc.reserved;
            }});
        if (!source) return layer < 1 ? this.salvageEnergy(creep, layer + 1) : false;
        source.reserved = true;
        // noinspection JSCheckFunctionSignatures
        if(creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
        return true;
    },
    /** @param {Creep} creep
     * @param {Boolean} ifExistsBetter - if true, creep will only withdraw energy if there is a more useful place for it*/
    gatherUselessEnergy: function(creep, ifExistsBetter = false)  {
        let usefulStores = ifExistsBetter ? creep.room.find(FIND_MY_STRUCTURES, {
            filter: (struc) => {
                return [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].includes(struc.structureType)
                    && struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    && !struc.reserved;
            }
        }) : [];
        let uselessStore = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (struc) => {
                return [STRUCTURE_STORAGE, STRUCTURE_CONTAINER].includes(struc.structureType)
                    && struc.store[RESOURCE_ENERGY] > 0
                    && !struc.reserved;
            }
        });
        if (usefulStores.length > 0 && uselessStore !== null) {
            uselessStore.reserved = true;
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
        if (fromRuins && this.salvageEnergy(creep)) return;
        if(!this.gatherEnergy(creep)) {
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
        console.log('Error:', message);
        Game.notify(message, 10);
    }
};