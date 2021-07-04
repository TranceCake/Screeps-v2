var roleUpgrader = require('role.upgrader');
var scheduler = require('scheduler');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        
        // used all energy, stop working
        if(creep.memory.working && creep.carry.energy == 0) {
            creep.memory.working = false;
        }

        // energy at full capacity, start working
        else if(!creep.memory.working && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
        

        // instructions & harvesting
	    if(creep.memory.working) {
	        if(creep.pos.isNearTo(creep.pos.findClosestByRange(FIND_SOURCES))) {
	            var direction = creep.pos.getDirectionTo(creep.pos.findClosestByRange(FIND_SOURCES));
	            if(direction < 5) {
	                //console.log(direction + ' ' + (direction + 4));
	                creep.move(direction + 4);
	            } else {
	                //console.log(direction + ' ' + (direction - 4));
	                creep.move(direction - 4);
	            }
	        }
	        
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            var prioritySites = _.filter(sites, (s) => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL);
            var topPrioritySites = _.filter(sites, (s) => s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_TOWER);
            
            if(topPrioritySites.length > 0) {
                site = creep.pos.findClosestByPath(topPrioritySites);
                result = work(creep, site);
            } else if(prioritySites.length > 0) {
                site = creep.pos.findClosestByPath(prioritySites);
                result = work(creep, site);
            } else if(sites.length > 0) {
                site = creep.pos.findClosestByPath(sites);
                result = work(creep, site);
            } else {
                roleUpgrader.run(creep);
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

module.exports = roleBuilder;

function work(creep, target) {
    if(creep.build(target) === ERR_NOT_IN_RANGE) {
        return creep.moveTo(target);
    } else {
        return creep.build(target);
    }
}

function collect(creep, target) {
    if(!creep.pos.isNearTo(target)) {
        return creep.moveTo(target);
    } else {
        return creep.harvest(target);
    }
}








