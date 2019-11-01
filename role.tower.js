'use strict';
const utils = require('./misc.utils');

module.exports = {
    /** @param {StructureTower} tower **/
    run: function(tower) {
        let hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (hostile) {
            tower.attack(hostile);
        } else if(tower.store[RESOURCE_ENERGY] > 200) {
            utils.repair(tower);
        }
    }
};