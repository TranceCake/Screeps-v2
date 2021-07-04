var roleUpgrader = require('role.upgrader');
var scheduler = require('scheduler');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        
        // used all energy, stop working
        if(creep.memory.working && creep.carry.energy == 0) {
            creep.memory.working = false;
        }
    
        // energy at full capacity, release spot and start working
        else if(!creep.memory.working && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
        

        // instructions & harvesting
	    if(creep.memory.working) {
	        var energyStorages = creep.room.find(FIND_STRUCTURES, {
	            filter: (o) => o.energy < o.energyCapacity
	        });
            
            if(energyStorages.length > 0) {
                var priorityStorages = _.filter(energyStorages, (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION);
                if(priorityStorages.length > 0) {
                    result = work(creep, creep.pos.findClosestByPath(priorityStorages));
                } else {
                    result = work(creep, creep.pos.findClosestByPath(energyStorages));
                }
            } else {
                roleUpgrader.run(creep);
            }
        } else {
            var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
            
            if(target !== null && creep.pos.getRangeTo(target) < 10) {
                result = collect(creep, target);
            } else {
                var sources = creep.room.find(FIND_SOURCES, {
                    filter: (s) => s.energy > 0
                });
                
                var source = creep.pos.findClosestByPath(sources);
                
                if(source !== null)
                    result = collect(creep, source);
            }
        }
        creep.memory.result = result;
	}
};

module.exports = roleHarvester;

function work(creep, target) {
    if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        return creep.moveTo(target);
    } else {
        return creep.transfer(target, RESOURCE_ENERGY);
    }
}

function collect(creep, target) {
    if(!creep.pos.isNearTo(target)) {
        return creep.moveTo(target);
    } else {
        if(target.energyCapacity !== undefined) {
            return creep.harvest(target);
        } else {
            return creep.pickup(target);
        }
    } 
}





