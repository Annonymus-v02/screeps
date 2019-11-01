'use strict';

const roleHarvester = require('./role.harvester');
const roleUpgrader = require('./role.upgrader');
const roleBuilder = require('./role.builder');
const roleHauler = require('./role.hauler');
const roleTower = require('./role.tower');
const roleSpawn = require('./role.spawn');
// const utils = require("./misc.utils");

module.exports.loop = function () {

    // TODO: change the way harvesters work: make them sit at a source and extract forever, then have haulers come pick up the energy.
    // This may require automatically building storage there.
    // TODO: typed-creeps is broken. replace it with screeps autocomplete
    // TODO: have haulers (et al) take from harvesters too.
    // TODO: find a way to prevent haulers from gathering around a single target (e.g. a tower)

    // Don;t use this store data for a single tick - Just set a property on the relevant object for that
    // TODO: redo this. It's ugly
    if (Array.isArray(Memory.nextTick)) {
        for (let i in Memory.nextTick){
            if(!Memory.nextTick.hasOwnProperty(i)) continue;
            let cb = Memory.nextTick[i];
            if(!cb()) {
                delete Memory.nextTick[i];
            }
        }
    }

    let ontick = [];
    // replenish creeps
    ontick[0] = ()=>{
        for (let spawn in Game.spawns) {
            roleSpawn.spawn(Game.spawns[spawn]);
        }
    };
    // UNUSED
    ontick[1] = ()=> {};
    // remove memory of non-existant creeps
    ontick[2] = ()=> {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                if (Memory.creeps[name].source) {
                    --Game.spawns[Memory.creeps[name].spawn].room.memory.sources[Memory.creeps[name].source].used;
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
    ontick[33] = ontick[2];
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

    for (let spawn in Game.spawns) {
        roleSpawn.run(Game.spawns[spawn]);
    }

    // execute individual creep's  actions
    let cachedError;
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
            if (!cachedError) cachedError = err;
        }
    }
    if(cachedError) throw cachedError;

    for (let tower of Game.spawns['Spawn1'].room.find(FIND_MY_STRUCTURES,
        {filter: (struc)=>{return struc.structureType === STRUCTURE_TOWER}})) {
        roleTower.run(tower);
    }
    
};