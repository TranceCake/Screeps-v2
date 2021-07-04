var roleTank = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        var marker = Game.flags['Tank'];
        var hold = Game.flags['Tank-Hold'];
        
        if(hold === undefined) {
            
            if(marker !== undefined) {
                if(!creep.pos.inRangeTo(marker, 0)) {
                    console.log('test');
                    result = creep.moveTo(marker);
                }
            } else {
                console.log('test2')
            }
        } else {
            if(!creep.pos.isNearTo(hold)) {
                result = creep.moveTo(hold);
            }
        }
        creep.memory.result = result;
    }
};

module.exports = roleTank;