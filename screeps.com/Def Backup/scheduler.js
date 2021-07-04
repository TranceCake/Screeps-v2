var scheduler = {
    getState: function() {
        
    },
    
    request: function(creep) {
        var sites = Memory.sites;
        for(var site in sites) {
            var creepsInRoom = _.filter(Game.creeps, (c) => c.room.name == creep.room.name);
            var available = _.filter(creepsInRoom, (c) => c.memory.target !== site);
            
            if(available != null) {
                creep.memory.target = available[0];
            }
        }
    },
    
    release: function(creep) {
        for(var spot in Memory.spots[creep.room]) {
            if(creep.memory.target[i] == spot[creep.room][i]) {
                creep.memory.target = null;
                Memory.sites[creep.room][i] = true;
            }
        }
    },
};

module.exports = scheduler;

/*
idea: make the creep memory only hold coordinates they are given to equalize all targets
- hold all spots in schedular local memory if that exists
- make harvesting creeps go to coordinates next to sources and then find the sources by closes range to save on cpu instead of pathfinding

*/