var roleDrainer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        var marker = Game.flags['Drain'];
        var position = Game.flags['Position'];
        var hold = Game.flags['Drain-Hold'];
        
        if(hold === undefined) {
            
            if(marker !== undefined) {
                
                if(marker.room !== undefined && marker.room.name === creep.room.name) {
                    var creeps = _.filter(creep.room.find(FIND_MY_CREEPS), c => c.room.name === creep.room.name);
                    
                    if(creeps.length > 0) {
                        var target = creeps[0];
                        for(c of creeps) {
                            if(c.hits/c.hitsMax < target.hits/target.hitsMax)
                                target = c;
                        }
                        
                        if(creep.heal(target) === ERR_NOT_IN_RANGE) {
                            result = creep.moveTo(target);
                        } else {
                            if(!creep.pos.isNearTo(target)) {
                                creep.moveTo(target);
                            }
                            result = creep.heal(target);
                            creep.moveTo(marker);
                        }
                    } else {
                        result = creep.moveTo(marker);
                    }
                } else {
                    result = creep.moveTo(marker);
                }
            }
        } else {
            if(!creep.pos.isNearTo(hold)) {
                result = creep.moveTo(hold);
            }
        }
        creep.memory.result = result;
    }
};

module.exports = roleDrainer;