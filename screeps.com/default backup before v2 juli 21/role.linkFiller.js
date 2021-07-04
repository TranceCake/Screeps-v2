var roleLinkFiller = {
    run: function(creep) {
        var result;
        var storage = creep.room.storage;
        var link = _.filter(creep.room.find(FIND_MY_STRUCTURES), s => s.structureType === STRUCTURE_LINK && s.pos.isNearTo(storage))[0];
        var terminal = creep.room.terminal;
        var flag = Game.flags[creep.room.name + '-D'];
        var boosted = Game.flags['Boost'];
        
        if(!!flag) {
            if(!creep.pos.isEqualTo(flag)) {
                creep.moveTo(flag);
            } else {
                if(creep.carry.energy === 0 && (!!storage && !!storage.store && storage.store[RESOURCE_ENERGY] > 800)) {
                    creep.withdraw(storage, RESOURCE_ENERGY, 800);
                } else if(creep.carry.energy === 0 && !(!!storage && !!storage.store && storage.store[RESOURCE_ENERGY] > 800) && (!!terminal && !!terminal.store && terminal.store[RESOURCE_ENERGY] > 800)) {
                    creep.withdraw(terminal, RESOURCE_ENERGY, 800);
                } else if(creep.ticksToLive <= 1) {
                    creep.transfer(storage, RESOURCE_ENERGY, 800);
                }
                
                if(!!storage && !!storage.store && link.energy === 0 && (storage.store[RESOURCE_ENERGY] > 15800 || (creep.room.controller.ticksToDowngrade < 2500 && storage.store[RESOURCE_ENERGY] > 800))) {
                    // console.log('fill link ' + creep.room.name)
                    creep.withdraw(storage, RESOURCE_ENERGY, 800);
                    creep.transfer(link, RESOURCE_ENERGY, 800);
                } else if(!!storage && storage.store && !!terminal && storage.store[RESOURCE_ENERGY] > 400800) {
                    //console.log('fill terminal ' + creep.room.name)
                    creep.withdraw(storage, RESOURCE_ENERGY, 800);
                    creep.transfer(terminal, RESOURCE_ENERGY, 800);
                } else if((!!terminal && !!terminal.store && terminal.store[RESOURCE_ENERGY] >= 800 && !!storage) && ((!!boosted && creep.room.name === boosted.room.name && !!storage) || (terminal.store[RESOURCE_ENERGY] > 10000))) {
                    //console.log('fill storage ' + creep.room.name)
                    creep.withdraw(terminal, RESOURCE_ENERGY, 800);
                    creep.transfer(storage, RESOURCE_ENERGY, 800);
                }
            }
            creep.memory.result = result;
        }
    }
};

module.exports = roleLinkFiller;