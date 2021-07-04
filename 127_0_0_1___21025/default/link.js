var link = {
    run: function(link) {
        var storage = link.room.storage;
        
        if(storage !== undefined && link.cooldown === 0) {
            if(link.pos.isNearTo(storage)) {
                var receiver = _.filter(link.room.find(FIND_MY_STRUCTURES), s => s.structureType === STRUCTURE_LINK && s.id !== link.id);
                
                if(receiver.length > 0 && receiver[0].energy === 0) {
                    result = link.transferEnergy(receiver[0], link.energy);
                }
            }
        }
    }
};

module.exports = link;