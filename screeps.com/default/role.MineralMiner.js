var mineralMiner = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        var mineral = Game.getObjectById(creep.memory.mineralId);
        
        if(creep.memory.working && _.sum(creep.carry) === creep.carryCapacity) {
            creep.memory.working = false;
        } else if(!creep.memory.working && _.sum(creep.carry) === 0) {
            if(creep.ticksToLive < 1000) {
                var spawn = Game.getObjectById(creep.memory.spawnId);
                if(!creep.pos.isNearTo(spawn)) { 
                    creep.moveTo(spawn);
                    return;
                } else {
                    spawn.renewCreep(creep);
                    return;
                }
            } else {
                creep.memory.working = true;
            }
        } else if(creep.room.memory.threatLevel === 1) {
            creep.memory.working = false;
        }
        
        if(creep.memory.working) {
            result = creep.harvest(mineral);
            if(result === ERR_NOT_IN_RANGE) {
                result = creep.moveTo(mineral);
            }
        } else {
            var storage = creep.room.storage;
            if(!creep.pos.isNearTo(storage)) {
                result = creep.moveTo(storage);
            } else {
                result = creep.transfer(storage, creep.memory.mineralType, creep.carry[creep.memory.mineralType]);
            }
        }
        creep.memory.result = result;
    }
};

module.exports = mineralMiner;