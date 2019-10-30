'use strict';

const roleHarvester = require('./role.harvester');
const roleUpgrader = require('./role.upgrader');
const roleBuilder = require('./role.builder');
const roleHauler = require('./role.hauler');
const utils = require("./misc.utils");

class _CreepConstants {
    constructor() {

    }
    get creepTypes() {
        return {
            'hauler': 0,
            'upgrader': 0,
            'harvester': 0,
            'builder': 0,
        }
    }

    optimalCreeps(room) {
        let opt = {
            'harvester': 0,
            'builder': 2,
            'upgrader': 1,
            'hauler': 0
        },
        sources = utils.getSources(room);
        for (let source in sources) {
            if (!sources.hasOwnProperty(source) || source === 'v') continue;
            opt['harvester'] += sources[source].spots;
            opt['hauler'] += sources[source].spots;
        }
        return opt;
    }

    creepBody(role, energy) {
        const incrementalBodies = (role, i) => {
            switch(role) {
                case 'harvester':
                    if (i === 0) {
                        return MOVE;
                    }
                    if (i === 1) {
                        return CARRY;
                    }
                    if (i % 10 === 0) {
                        return MOVE;
                    }
                    if (i % 5 === 0) {
                        return CARRY;
                    }
                    return WORK;
                case 'builder':
                    return [CARRY, MOVE, WORK, CARRY, MOVE][i % 5];
                case 'upgrader':
                    return [CARRY, MOVE, WORK][i % 3];
                case 'hauler':
                    if (i === 0) {
                        return WORK;
                    }
                    --i;
                    return [CARRY, CARRY, MOVE][i % 3];
            }
        };

        let body = {cost: 0, parts: []};
        body.add = (part)=>{
            body.parts.push(part);
            body.cost += BODYPART_COST[part];
        };

        for (let i = 0; body.cost <= energy; i++) {
            body.add(incrementalBodies(role,i));
        }
        body.parts.pop();
        return body.parts;
    }
}

const creepConstants = new _CreepConstants();

module.exports.loop = function () {

    // TODO: change the way harvesters work: make them sit at a source and extract forever, then have haulers come pick up the energy.
    // This may require automatically building storage there.
    // TODO: typed-creeps is broken. replace it with screeps autocomplete
    // TODO: have haulers (et al) take from harvesters too.
    // TODO: IFF there is no harvester, make haulers mine
    // TODO: if there is no hauler, make one with as much energy as is available (min 300)
    // TODO: make builders repair before upgrading if they have nothing to do.

    let ontick = [];
    // replenish creeps
    ontick[0] = ()=>{
        if (Game.spawns['Spawn1'].spawning) return;
        const optimalCreeps = creepConstants.optimalCreeps(Game.spawns['Spawn1'].room);

        let availableEnergy = Game.spawns['Spawn1'].room.energyCapacityAvailable;
    
        let creeps = creepConstants.creepTypes;
        for (let creep in Game.creeps) {
            // noinspection JSUnresolvedVariable
            creeps[Game.creeps[creep].memory.role]++
        }

        let leastPresent = {};

        for (let role in creeps) {
            if (!creeps.hasOwnProperty(role)) continue;
            if (!creeps.hasOwnProperty(role)) continue;
            if (creeps[role] < optimalCreeps[role]) {
                if (!leastPresent.role || leastPresent.num > creeps[role]) {
                    leastPresent.role = role;
                    leastPresent.num = creeps[role];
                }
            }
        }
        console.log('attempting to spawn new creeps: ', JSON.stringify(creeps), JSON.stringify(optimalCreeps));

        if (creeps['hauler'] === 0) {
            let energy = Game.spawns['Spawn1'].room.energyAvailable;
            if (energy >= 300) {
                Game.spawns['Spawn1'].spawnCreep(creepConstants.creepBody('hauler', energy),
                    'hauler' + Game.time, {memory: {role: 'hauler', cb: [], spawn: Game.spawns['Spawn1'].name}})
            }
            return;
        }

        if (leastPresent.role) {
            let newName = leastPresent.role + Game.time;
            let res = Game.spawns['Spawn1'].spawnCreep(creepConstants.creepBody(leastPresent.role, availableEnergy),
                newName, {memory: {role: leastPresent.role, cb: [], spawn: Game.spawns['Spawn1'].name}});
            if(res !== ERR_NOT_ENOUGH_ENERGY && res !== 0) {
                utils.err('Spawning new creep resulted in ' + res);
            }
            console.log(res);

        }

    };
    // UNUSED
    ontick[1] = ()=> {};
    // remove memory of non-existant creeps
    ontick[2] = ()=> {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                if (Memory.creeps[name].source) {
                    utils.err(Memory.creeps[name].spawn, Game.spawns[Memory.creeps[name].spawn].room.memory.sources);
                    --Game.spawns[Memory.creeps[name].spawn].room.memory.sources[Memory.creeps[name].source];
                }
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
            if (!creepMemory.spawn) {
                console.log('anomalous creep without assigned spawn found:', name);
                creepMemory.spawn = 'Spawn1';
            }
        }
    };
    // spawn creeps a bit more often
    ontick[32] = ontick[0];
    // only perform these expensive operations once every 64 ticks
    if (ontick[Game.time & 0x3F]) ontick[Game.time & 0x3F]();
    
    // for debugging
    if (Memory.debug) {
        if (Memory.debug.setCreepMem === true) {
            Memory.debug.setCreepMem = false;

            ontick[3]();
        }
        if(Memory.debug.spawnCreeps === true) {
            Memory.debug.spawnCreeps = false;
            ontick[0]();
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

    // execute individual creep's  actions
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if (creep.spawning) continue;
        try {
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
                case 'hauler':
                    roleHauler.run(creep);
                    break;
                default:
                    console.log('Unknown role:', creep.memory.role);
            }
        } catch (err) {
            utils.err(JSON.stringify(err));
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