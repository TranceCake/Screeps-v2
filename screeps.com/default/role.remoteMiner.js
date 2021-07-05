var remoteMiner = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        var marker = Game.flags['Remote-'+creep.memory.remote];
        
        if(creep.hits < creep.hitsMax)
            creep.heal(creep);
        
        if(marker !== undefined) {
            if(marker.room !== undefined && marker.room.name === creep.room.name) {
                var lair = Game.getObjectById(creep.memory.lairId);
                if(!!lair && (lair.ticksToSpawn > 290 || lair.ticksToSpawn < 10 || !lair.ticksToSpawn)) {
                   result = creep.moveTo(marker);
                } else {
                    var source = Game.getObjectById(creep.memory.sourceId);
                  
                    result = creep.harvest(source);
                    if(result = ERR_NOT_IN_RANGE) {
                        result = creep.moveTo(source);
                    }
                }
            } else {
                result = creep.moveTo(marker);
            }
        }
        creep.memory.result = result;
    }
};

module.exports = remoteMiner;