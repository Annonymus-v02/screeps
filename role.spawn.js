'use strict';
const utils = require('./misc.utils');
const creepConstants = require('./creep_constants');

module.exports = {
    /** @param {StructureSpawn} spawn **/
    run: function(spawn) {
        // draw spawning creeps
        if(spawn.spawning) {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '\u{1F6E0}️' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                {align: 'left', opacity: 0.8});
        }

        // renew nearby creeps
        for (let i = -1; i < 1; i++) {
            for (let j = -1; j < 1; j++) {
                if (i || j) {
                    let creeps = new RoomPosition(spawn.pos.x + i, spawn.pos.y + j, spawn.room.name)
                                 .lookFor(LOOK_CREEPS);
                    if (creeps.length > 0) {
                        spawn.renewCreep(creeps[0]);
                    }
                }
            }
        }
    },

    /** @param {StructureSpawn} spawn **/
    spawn: function(spawn) {
        if (spawn.spawning) return;
        const optimalCreeps = creepConstants.optimalCreeps(spawn.room);

        let creeps = creepConstants.creepTypes;
        // TODO: maybe move this out into the creep code
        for (let creep in Game.creeps) {
            creeps[Game.creeps[creep].memory.role]++
        }

        if (creeps['hauler'] === 0) {
            let energy = spawn.room.energyAvailable;
            if (energy >= 300) {
                spawn.spawnCreep(creepConstants.creepBody('hauler', energy),
                    'hauler' + (Game.time - 12170000),
                    {memory: {role: 'hauler', cb: [], spawn: spawn.name}})
            }
            return;
        }

        let leastPresent = {};

        for (let role in creeps) {
            if (!creeps.hasOwnProperty(role)) continue;
            if (creeps[role] < optimalCreeps[role]) {
                if (!leastPresent.role || leastPresent.num > creeps[role]) {
                    leastPresent.role = role;
                    leastPresent.num = creeps[role];
                }
            }
        }
        console.log('['+spawn.name+']', 'attempting to spawn new creeps: ',
            JSON.stringify(creeps), JSON.stringify(optimalCreeps));

        if (leastPresent.role) {
            let availableEnergy = spawn.room.energyCapacityAvailable;
            let newName = leastPresent.role + (Game.time - 12170000);
            let res = spawn.spawnCreep(creepConstants.creepBody(leastPresent.role, availableEnergy),
                newName, {memory: {role: leastPresent.role, cb: [], spawn: spawn.name}});
            if(res !== ERR_NOT_ENOUGH_ENERGY && res !== 0) {
                utils.err('Spawning new creep resulted in ' + res);
            }
            console.log(res);
        }
    }
};