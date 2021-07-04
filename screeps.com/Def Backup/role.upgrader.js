var scheduler = require('scheduler');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var result;

        // used all energy, stop working
        if(creep.memory.working && creep.carry.energy == 0)
            creep.memory.working = false;

        // energy at full capacity, release spot and start working
        else if(!creep.memory.working && creep.carry.energy == creep.carryCapacity) {
            //scheduler.release(creep);
            creep.memory.working = true;
        }

        // instructions & harvesting
	    if(creep.memory.working) {
            if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                result = creep.moveTo(creep.room.controller);
            } else {
                result = creep.upgradeController(creep.room.controller);
            }
        } else {
            var sources = creep.room.find(FIND_SOURCES, {
                filter: (s) => s.energy > 0
            });
            
            var source = creep.pos.findClosestByPath(sources);
            
            if(source !== null)
                result = collect(creep, source);
        }
        creep.memory.result = result;
	}
};

module.exports = roleUpgrader;

function collect(creep, target) {
    if(!creep.pos.isNearTo(target)) {
        return creep.moveTo(target);
    } else {
        return creep.harvest(target);
    }
}
