var terminal = {
    /** @param {Terminal} creep **/
    run: function(terminal, boosted) {
        var terminals = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_TERMINAL);
        var remoteFlags = _.filter(Game.flags, f => f.name.includes('RemoteSpawn-'));
        //console.log(flags)
        if(!!terminal && terminal.store[RESOURCE_ENERGY] > 12000) {
            var demand = _.filter(terminals, t => t.store[RESOURCE_ENERGY] < 11000  && t.id !== terminal.id && _.find(remoteFlags, f => f.room.name === t.room.name) === undefined);
            var dest = _.min(demand, t => t.store[RESOURCE_ENERGY]);
            var source = terminal;
            
            if(!!dest) {
                var destRoom = dest.room;
                var result = terminal.send(RESOURCE_ENERGY, 1000, destRoom.name, 'Help');
                log.transferInfo(source.room.name + ' (' + source.store[RESOURCE_ENERGY] + ') sent energy to ' + destRoom.name + ' (' + dest.store[RESOURCE_ENERGY] + ') with result: ' + result);
            }
        }
        
        // var avg = _.sum(terminals, t => t.store[RESOURCE_ENERGY]) / terminals.length;
        // var lowestTerminal = _.min(terminals, t => t.store[RESOURCE_ENERGY]);
        
        // if(lowestTerminal.id !== terminal.id) {
        //     if(!!terminal.store && terminal.store[RESOURCE_ENERGY] - avg > 10000 && !!lowestTerminal.store) {
        //         console.log(terminal.room.name + ' (' + terminal.store[RESOURCE_ENERGY] + ') to ' + lowestTerminal.room.name + ' (' + lowestTerminal.store[RESOURCE_ENERGY] + ') avg: ' + Math.round(avg));
        //         var receiver = lowestTerminal.room;
        //         var result = terminal.send(RESOURCE_ENERGY, 1000, receiver.name, 'equalize');
        //     }
        // }
        
        // // so essentially the thing you'll want to send is x = total_amount/(1+(Math.log(0.1*linearDistanceBetweenRooms + 0.9) + 0.1))
        // if(!!boosted && terminal.store[RESOURCE_ENERGY] > 5000) {
        //     var receiver = boosted.room;
        //     var result = terminal.send(RESOURCE_ENERGY, 1000, receiver.name, 'boost');
        // }
    }
};

module.exports = terminal;