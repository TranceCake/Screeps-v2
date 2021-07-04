var roleRemoteBuilder = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var marker = Game.flags['Spawn'];
        var result;
        
        if(creep.hits < creep.hitsMax)
            creep.heal(creep);
        
        if(marker !== undefined) {
            if(marker.room !== undefined && marker.room.name === creep.room.name) {
                result = this.work(creep);
            } else {
                result = creep.moveTo(marker);
            }
        } else {
            result = this.work(creep);
        }
        creep.memory.result = result;
    },
    
    work: function(creep) {
        // used all energy, stop working
        if(creep.memory.working && creep.carry.energy == 0) {
            creep.memory.working = false;
        }
    
        // energy at full capacity, release spot and start working
        else if(!creep.memory.working && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
        
        if(creep.memory.working) {
            var site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            var result;
            
            if(!!site) {
                if(creep.build(site) === ERR_NOT_IN_RANGE) {
                    result = creep.moveTo(site);
                } else {
                    result = creep.build(site);
                }
            } else {
                var containers = _.filter(creep.room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] < s.store.capacity);
                var container = creep.pos.findClosestByPath(containers);
                if(!!container) {
                    if(creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        result = creep.moveTo(container);
                    } else {
                        result = creep.transfer(container, RESOURCE_ENERGY);
                    }
                } else {
                    let controller = creep.room.controller;
                    if(!!controller) {
                        if(creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                            result = creep.moveTo(controller);
                        } else {
                            result = creep.upgradeController(controller);
                        }
                    }
                }
            }
        } else {
            var dropped_energy = _.filter(creep.room.find(FIND_DROPPED_RESOURCES), e => e.amount >= (creep.carryCapacity * 0.3) || e.amount >= creep.carryCapacity - _.sum(creep.carry) && e.resourceType === RESOURCE_ENERGY);
            
            if(dropped_energy.length > 0) {
                var target = dropped_energy[0];
                var targetValue = target.amount / creep.pos.findPathTo(target).length;
                
                for(let t of dropped_energy) {
                    var value = t.amount / creep.pos.findPathTo(t).length;
                    if(value > targetValue) {
                        target = t;
                        targetValue = value;
                    }
                }
                
                
            } else {
                var target = creep.pos.findClosestByPath(_.filter(creep.room.find(FIND_SOURCES), s => s.energy > 0));
            }
            
            if(!creep.pos.isNearTo(target)) {
                result = creep.moveTo(target);
            } else {
                result = creep.harvest(target);
                if(result === -7) {
                    result = creep.pickup(target);
                }
            }
        }
        return result;
    }
};

module.exports = roleRemoteBuilder;