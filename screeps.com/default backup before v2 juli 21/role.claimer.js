var roleClaimer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var marker = Game.flags['Claim'];
        var result;
        
        if(marker !== undefined) {
            if(marker.room !== undefined && marker.room.name === creep.room.name) {
                var controller = creep.room.controller;
                
                if(creep.claimController(controller) === ERR_NOT_IN_RANGE) {
                    result = creep.moveTo(controller);
                } else {
                    if(controller.owner === null) {
                        result = creep.claimController(controller);
                    } else {
                        result = creep.attackController(controller);
                    }
                }
            } else {
                result = creep.moveTo(marker);
            }
        }
        creep.memory.result = result;
    }
};

module.exports = roleClaimer;