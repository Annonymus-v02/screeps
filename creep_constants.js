'use strict';
const utils = require('./misc.utils');

class _CreepConstants {
    constructor() { }

    get creepTypes() {
        return {
            'hauler': 0,
            'harvester': 0,
            'upgrader': 0,
            'builder': 0,
            'swapper': 0,
        }
    }

    optimalCreeps(room) {
        let opt = {
                'hauler': 0,
                'harvester': 0,
                'upgrader': 1,
                'builder': 2,
                'swapper': 1,
            },
            sources = utils.getSources(room);
        for (let source in sources) {
            if (!sources.hasOwnProperty(source) || source === 'v') continue;
            opt['harvester'] += sources[source].spots;
            opt['hauler'] += sources[source].spots;
        }
        opt['hauler'] = Math.floor(opt['hauler'] / 2);
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
                    return [MOVE, CARRY, CARRY][i % 3];
                case 'swapper':
                    if (i === 0) {
                        return WORK;
                    }
                    --i;
                    return [MOVE, CARRY, CARRY][i % 3];
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

module.exports = new _CreepConstants();