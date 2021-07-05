var roleRaider = {
    run: function(creep) {
        var result;
        var marker = Game.flags['Raid'];
        
        if(marker !== undefined) {
            if(!creep.memory.working && creep.carry.energy === 0) {
                if(creep.ticksToLive < 700) {
                    if(!creep.pos.isNearTo(Game.spawns.Spawn1)) { 
                        creep.moveTo(Game.spawns.Spawn1);
                        return;
                    } else {
                        Game.spawns.Spawn1.renewCreep(creep);
                        return;
                    }
                } else {
                    creep.memory.working = true;
                }
            } else if(creep.memory.working && creep.carry.energy === creep.carryCapacity) {
                creep.memory.working = false;
            }
            
            var waypoints = _.filter(Game.flags, f => f.name.includes("Raid-WP"));
            if(creep.memory.waypoints === undefined || creep.memory.waypoints.length !== waypoints.length) {
                creep.memory.waypoints = waypoints;
                
                if(creep.memory.waypoint > waypoints.length)
                    creep.memory.waypoint = waypoints.length;
            }
            
            if(creep.memory.working) {
                if(marker.room !== undefined && marker.room.name === creep.room.name) {
                    var target = creep.room.storage;
                  
                    if(target !== undefined && _.sum(target.store) > 0) {
                        var content = Object.keys(creep.carry);
                        
                        if(creep.withdraw(target, content[0], creep.carryCapacity - _.sum(creep.carry)) === ERR_NOT_IN_RANGE) {
                            result = creep.moveTo(target);
                        } else {
                            result = creep.withdraw(target, content[0], creep.carryCapacity - _.sum(creep.carry));
                            if(result === ERR_NOT_ENOUGH_ENERGY)
                                Game.flags['Raid'].remove;
                        }
                    }
                } else {
                    if(creep.memory.waypoints.length > 0) {
                        var currentWP = Game.flags['Raid-WP'+creep.memory.waypoint];
                        if(!creep.pos.isNearTo(currentWP) && creep.memory.waypoint !== creep.memory.waypoints.length) {
                            result = creep.moveTo(currentWP);
                        } else {
                            if(creep.memory.waypoint === creep.memory.waypoints.length) {
                                result = creep.moveTo(marker);
                            } else {
                                creep.memory.waypoint = creep.memory.waypoint + 1;
                                result = creep.moveTo(Game.flags['Raid-WP'+creep.memory.waypoint]);
                            }
                        }
                    } else {
                        result = creep.moveTo(marker);
                    }
                }
            } else {
                var home = _.filter(Game.spawns, s => Game.flags['Raid-Home'] && s.room.name === Game.flags['Raid-Home'].room.name)[0];
                
                if(home === undefined)
                    home = Game.spawns.Spawn1;
                
                if(creep.room.name === home.room.name) {
                    var storage = creep.room.storage;
                  
                    if(storage !== undefined) {
                        if(creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            result = creep.moveTo(storage);
                        } else {
                            result = creep.transfer(storage, RESOURCE_ENERGY);
                        }
                    }
                } else {
                    if(creep.memory.waypoints.length > 0) {
                        var currentWP = Game.flags['Raid-WP'+creep.memory.waypoint];
                        if(!creep.pos.isNearTo(currentWP) && creep.memory.waypoint !== 1) {
                            result = creep.moveTo(currentWP);
                        } else {
                            if(creep.memory.waypoint === 1) {
                                result = creep.moveTo(home);
                            } else {
                                creep.memory.waypoint = creep.memory.waypoint - 1;
                                creep.moveTo(Game.flags['Raid-WP'+creep.memory.waypoint]);
                            }
                        }
                    } else {
                        result = creep.moveTo(home);
                    }
                }
            }
        }
        creep.memory.result = result;
    }
};

module.exports = roleRaider;