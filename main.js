const roleHarvester = require('./role.harvester');
const roleUpgrader = require('./role.upgrader');
const roleBuilder = require('./role.builder');

module.exports.loop = function () {
    
    // TODO: set up some error reporting mechanism that doesn't rely on the console. 
    // Probably in a debug object in memory. Maybe send a mail for the more important ones.
    // TODO: change the way harvesters work: make them sit at a source and extract forever, then have haulers come pick up the energy.
    // This may require automatically building containers there.
    
    let ontick = [];
    ontick[0] = ()=>{
        const optimalCreeps = {
            'harvester': 3,
            'builder': 2,
            'upgrader': 1
        };
        const creepBodies = {
            'harvester': [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            'builder': [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
            'upgrader': [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE]
        };
    
        let creeps = {
            'harvester': 0,
            'builder': 0,
            'upgrader': 0
        };
        for (let creep in Game.creeps) {
            Game.creeps[Game.creeps[creep].memory.role]++
        }
        
        for (let role in creeps) {
            if(creeps[role] < optimalCreeps[role]) {
                let newName = role + Game.time;
                Game.spawns['Spawn1'].spawnCreep(creepBodies[role], newName, 
                    {memory: {role: role, cb: []}});        
            }
        }
    }
    ontick[1] = ()=> {
        let room = Game.spawns['Spawn1'].room;
        if (!room.memory.sources || room.memory.sources.v !== 1) {
            room.memory.sources = {};
            room.memory.sources.v = 1;
            let sources = room.find(FIND_SOURCES);
            for (let sourcei in sources) {
                let source = sources[sourcei]
                room.memory.sources[sourcei] = {};
                room.memory.sources[sourcei].spots = 0;
                room.memory.sources[sourcei].id = source.id;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1 ; j <= 1; j++) {
                        if (i || j) {
                            if (!PathFinder.search(source.pos, new RoomPosition(source.pos.x + i, source.pos.y + j, source.room.name), 
                                {maxOps: 10, maxRooms: 1, maxCost: 20}).incomplete) {
                                room.memory.sources[sourcei].spots++;
                            }
                        }
                    }
                }
            }
        }
    }
    ontick[2] = ()=> {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing dead creep memory:', name);
            }
        }
    }
    ontick[3] = ()=>{
        for (let name in Game.creeps) {
            if (!Game.creeps[name].memory.role) {
                console.log('anomalous creep without role found:', name)
                Game.creeps[name].memory.role = 'harvester';
            }
            if (!Game.creeps[name].memory.cb) {
                console.log('anomalous creep without callback array found:', name)
                Game.creeps[name].memory.cb = [];
            }
        }
    }
    // only perform these expensive operations once every 64 ticks
    if (ontick[Game.time & 0x3F]) ontick[Game.time & 0x3F]();
    
    // for debugging
    if (Game.spawns['Spawn1'].memory.debug && Game.spawns['Spawn1'].memory.debug.calcSources === true) {
        Game.spawns['Spawn1'].memory.debug.calcSources = false;
        
        delete Game.spawns['Spawn1'].room.memory.sources;
        ontick[1]();
    }
    if (Game.spawns['Spawn1'].memory.debug && Game.spawns['Spawn1'].memory.debug.setCreepMem === true) {
        Game.spawns['Spawn1'].memory.debug.setCreepMem = false;
        
        ontick[3]();
    }
    
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
            // TODO: insert my username here
            let damaged = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struc)=>{
                return ((struc.owner ? struc.owner == 'annonymus' : false) 
                     || [STRUCTURE_WALL, STRUCTURE_CONTAINER, STRUCTURE_ROAD].includes(struc.structureType))
                     && struc.hits < struc.hitsMax;
            }});
            tower.repair(damaged);
        }
    }
    
}