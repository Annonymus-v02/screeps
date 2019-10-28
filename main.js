'use strict';

const roleHarvester = require('./role.harvester');
const roleUpgrader = require('./role.upgrader');
const roleBuilder = require('./role.builder');

class _CreepConstants {
    constructor() {
        this.optimalCreeps = {
            'harvester': 3,
            'builder': 2,
            'upgrader': 1
        }
    }

    creepBody(role, energy) {
        // noinspection DuplicatedCode
        const incrementalBodies = {
            'harvester': [WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE,
                          WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK,
                          CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE,
                          WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK,
                          CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE],
            'builder': [WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE,
                        WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK,
                        CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE,
                        WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK,
                        CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE],
            'upgrader': [WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE,
                         WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK,
                         CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE,
                         WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK,
                         CARRY, MOVE, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, MOVE],
        };

        let body = {cost: 0, parts: []};
        body.add = part=>{
            body.parts.push(part);
            cost += BODYPART_COST[part];
        };

        for (let i = 0; body.cost <= energy; i++) {
            body.add(incrementalBodies[role][i]);
        }
        body.parts.pop();
        return body.parts;
    }
}

const creepConstants = new _CreepConstants();

module.exports.loop = function () {

    // TODO: set up some error reporting mechanism that doesn't rely on the console. 
    // Probably in a debug object in memory. Maybe send a mail for the more important ones.
    // TODO: change the way harvesters work: make them sit at a source and extract forever, then have haulers come pick up the energy.
    // This may require automatically building storage there.
    
    let ontick = [];
    // replenish creeps
    ontick[0] = ()=>{
        const optimalCreeps = creepConstants.optimalCreeps;

        let availableEnergy = 0;
        // noinspection JSUnresolvedFunction
        availableEnergy += Game.spawns['Spawn1'].store.getCapacity(RESOURCE_ENERGY);
        let extensions = Game.spawns['Spawn1'].find(FIND_MY_STRUCTURES, {filter: struc=>{return struc.structureType === STRUCTURE_EXTENSION}});
        for (extension of extensions) {
            availableEnergy += extension.store.getCapacity(RESOURCE_ENERGY);
        }
    
        let creeps = {
            'harvester': 0,
            'builder': 0,
            'upgrader': 0
        };
        for (let creep in Game.creeps) {
            // noinspection JSUnresolvedVariable
            Game.creeps[Game.creeps[creep].memory.role]++
        }
        
        for (let role in creeps) {
            if(creeps[role] < optimalCreeps[role]) {
                let newName = role + Game.time;
                Game.spawns['Spawn1'].spawnCreep(creepConstants.creepBody(role, availableEnergy), newName,
                    {memory: {role: role, cb: []}});        
            }
        }
    };
    // document source spots
    ontick[1] = ()=> {
        let room = Game.spawns['Spawn1'].room;
        // This'll shut up the unresolved variable warnings
        /** * @type {Object} */
        let mem = room.memory;
        if (!mem.sources || mem.sources.v !== 1) {
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
    };
    // remove memory of non-existant creeps
    ontick[2] = ()=> {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing dead creep memory:', name);
            }
        }
    };
    // initialize memory of faulty creeps
    ontick[3] = ()=>{
        for (let name in Game.creeps) {
            /** @type {Object} */
            let creepMemory = Game.creeps[name].memory;
            if (!creepMemory.role) {
                console.log('anomalous creep without role found:', name);
                creepMemory.role = 'harvester';
            }
            if (!creepMemory.cb) {
                console.log('anomalous creep without callback array found:', name);
                creepMemory.cb = [];
            }
        }
    };
    // only perform these expensive operations once every 64 ticks
    if (ontick[Game.time & 0x3F]) ontick[Game.time & 0x3F]();
    
    // for debugging
    if (Memory.debug) {
        if (Memory.debug.setCreepMem === true) {
            Memory.debug.setCreepMem = false;

            ontick[3]();
        }
    }

    // draw spawning creeps
    for (let spawn in Game.spawns) {
        if(Game.spawns[spawn].spawning) { 
            let spawningCreep = Game.creeps[Game.spawns[spawn].spawning.name];
            Game.spawns[spawn].room.visual.text(
                '\u{1F6E0}️' + spawningCreep.memory.role,
                Game.spawns[spawn].pos.x + 1, 
                Game.spawns[spawn].pos.y, 
                {align: 'left', opacity: 0.8});
        }
    }

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        switch (creep.memory.role) {
            case 'harvester':
                roleHarvester.run(creep);
                break;
            case 'upgrader':
                roleUpgrader.run(creep);
                break;
            case 'builder':
                roleBuilder.run(creep);
                break;
            default:
                console.log('Unknown role:', creep.memory.role);
        }
    }

    for (let tower of Game.spawns['Spawn1'].room.find(FIND_MY_STRUCTURES, {filter: (struc)=>{return struc.structureType === STRUCTURE_TOWER}})) {
        let hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (hostile) {
            tower.attack(hostile);
        } else {
            let damaged = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struc)=>{
                return (struc.my
                     || [STRUCTURE_WALL, STRUCTURE_CONTAINER, STRUCTURE_ROAD].includes(struc.structureType))
                     && struc.hits < struc.hitsMax;
            }});
            tower.repair(damaged);
        }
    }
    
};