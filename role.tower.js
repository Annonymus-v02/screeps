'use strict';
const utils = require('./misc.utils');

module.exports = {
    /** @param {StructureTower} tower **/
    run: function(tower) {
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