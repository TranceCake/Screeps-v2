var roleCollector = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        
        // prevent creep from doing nothing
        if(creep.memory.path === undefined || Game.getObjectById(creep.memory.target) === null)
            result = this.findTarget(creep);
           
        // switch creep states and find new target
        if(creep.memory.working !== undefined) {
            if(creep.memory.working && _.sum(creep.carry) === 0) {
                creep.memory.working = false;
                result = this.findTarget(creep);
            } else if(!creep.memory.working && _.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.working = true;
                result = this.findTarget(creep);
            }
        } else {
            creep.memory.working = false;
        }
        
        // retrieve target object from its id in memory and decide what to do
        var target = Game.getObjectById(creep.memory.target);
        if(!target || target == undefined) {
            result = this.findTarget(creep);
        }

        if(!creep.pos.isNearTo(target)) {
            result = this.moveTo(creep);
        } else {
            result = this.work(target, creep);
        }
        
        creep.memory.result = result;
	},
	
	// calculates body size and composition based on available energy
	getBody: function (energy) {
        if (energy < BODYPART_COST[MOVE] + BODYPART_COST[CARRY]) {
            return null;
        }

        var carry = [], move = [];
        var cost = BODYPART_COST[MOVE] + BODYPART_COST[CARRY];

        while (energy >= cost) {
            if (carry.length < 6) {
                energy = this.addPart(energy, move, MOVE);
                energy = this.addPart(energy, carry, CARRY);
            } else {
                break;
            }
        }

        return carry.concat(move);
    },
    
    addPart: function (energy, parts, part) {
        parts.push(part);
        return energy - BODYPART_COST[part];
    },
    
    // searches for a suitable target
    findTarget: function(creep) {
        var exclude = [];
        var creepsInRoom = _.filter(Game.creeps, c => c.room.name === creep.room.name);
        var collectors = _.filter(creepsInRoom, c => c.memory.role === 'collector');
        for(let collector of collectors) {
            if(!(collector.memory.target === null || collector.memory.target === undefined)) {
                exclude.push(collector.memory.target);
            }
        }
        
        if(creep.memory.working) {
            if(creep.room.memory.threatLevel === 0) {
                var energyStorages = _.filter(creep.room.find(FIND_STRUCTURES), s => exclude.indexOf(s.id) < 0 && s.energy < s.energyCapacity && !(s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_TOWER));
                var priorityStorages = _.filter(energyStorages, (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION);
                
                if(priorityStorages.length > 0) {
                    var target = creep.pos.findClosestByPath(priorityStorages);
                } else {
                    var creepsInRoom = _.filter(Game.creeps, c => exclude.indexOf(c.id) < 0 && c.room.name === creep.room.name);
                    var linkFillers =  _.filter(creepsInRoom, c => c.memory.role === 'linkFiller' && c.room.name === creep.room.name);
                    
                    var lowCreeps = _.filter(creepsInRoom, c => ((c.memory.role === 'upgrader' && !linkFillers.length > 0) || (c.memory.role === 'builder' && c.memory.idle === false)) && c.carry.energy < (c.carryCapacity / 3));
                    var priorityCreeps = _.filter(lowCreeps, c => c.carry.energy === 0);
                    
                    if(priorityCreeps.length > 0) {
                        var target = creep.pos.findClosestByPath(priorityCreeps);
                    } else {
                        if(energyStorages.length > 0) {
                            var target = creep.pos.findClosestByPath(energyStorages);
                        } else {
                            if(lowCreeps.length > 0) {
                                var target = creep.pos.findClosestByPath(lowCreeps);
                            } else {
                                var towers = _.filter(creep.room.find(FIND_MY_STRUCTURES), s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.8);
                                
                                if(towers.length > 0) {
                                    var target = creep.pos.findClosestByPath(towers);
                                } else {
                                    var buffer = creep.room.storage;
                                    
                                    if(buffer !== undefined) {
                                        var target = buffer;
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                var towers = _.filter(creep.room.find(FIND_MY_STRUCTURES), s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.9);
             
                if(towers.length > 0) {
                    var target = creep.pos.findClosestByPath(towers);
                } else {
                    var priorityStorages = _.filter(creep.room.find(FIND_MY_STRUCTURES), (s) => exclude.indexOf(s.id) < 0 && s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION);
                    
                    if(priorityStorages.length > 0) {
                        var target = creep.pos.findClosestByPath(priorityStorages);
                    }
                }
            }
            
            if(!!target) {
                creep.memory.target = target.id;
                creep.memory.path = creep.room.findPath(creep.pos, target.pos, {serialize: true});
                return OK;
            } else {
                creep.memory.target = null;
                return ERR_NOT_FOUND;
            }
        } else {
            var targets = [];
            if(creep.room.memory.threatLevel === 0)
                targets = _.filter(creep.room.find(FIND_DROPPED_RESOURCES), e => e.amount >= (creep.carryCapacity * 0.3) || e.amount >= creep.carryCapacity - _.sum(creep.carry) && e.resourceType === RESOURCE_ENERGY);
                priorityTargets = _.filter(creep.room.find(FIND_TOMBSTONES), t => t.store >= (creep.carryCapacity * 0.3) || t.store >= creep.carryCapacity - _.sum(creep.carry));
            
            if(priorityTargets.length > 0) {
                var target = priorityTargets[0];
                var ttl = target.ticksToDecay;
                
                for(let t of targets) {
                    var value = t.ticksToDecay;
                    if(value > ttl) {
                        target = t;
                        ttl = value;
                    }
                }
            } else if(targets.length > 0) {
                var target = targets[0];
                var targetValue = target.amount / (creep.pos.findPathTo(target).length * 2);
                
                for(let t of targets) {
                    var value = t.amount / (creep.pos.findPathTo(t).length * 2);
                    if(value > targetValue) {
                        target = t;
                        targetValue = value;
                    }
                }
            } else {
                var priorityStorages = _.filter(creep.room.find(FIND_MY_STRUCTURES), (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.energy < s.energyCapacity);
                targets = _.filter(creep.room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 100);
                
                if(targets.length > 0) {
                    var target = targets[0];
                    var targetValue = target.store[RESOURCE_ENERGY] / creep.pos.findPathTo(target).length;
                    
                    for(let t of targets) {
                        var value = t.store[RESOURCE_ENERGY] / creep.pos.findPathTo(t).length;
                        if(value > targetValue) {
                            target = t;
                            targetValue = value;
                        }
                    }
                } else if(!(creep.room.storage === undefined || creep.room.storage.store === undefined) && (creep.room.storage.store[RESOURCE_ENERGY] > 16000  && priorityStorages.length !== 0)) {
                    var target = creep.room.storage;
                } else if(creep.room.memory.threatLevel === 1 && (!(creep.room.storage === undefined || creep.room.storage.store === undefined) && creep.room.storage.store[RESOURCE_ENERGY] > 0)) {
                    var target = creep.room.storage;
                }
            }
            
            if(!!target && target !== undefined) {
                creep.memory.target = target.id;
                creep.memory.path = creep.room.findPath(creep.pos, target.pos, {serialize: true});
                return OK;
            } else {
                creep.memory.target = null;
                return ERR_NOT_ENOUGH_ENERGY;
            }
        }
    },
    
    recalculatePath: function(creep) {
        var target = Game.getObjectById(creep.memory.target);
        if(!!target) {
            creep.memory.path = creep.room.findPath(creep.pos, target.pos, {serialize: true});
        } else {
            this.findTarget(creep);
        }
    },
    
    moveTo: function(creep) {
    	var result;
        
        if(creep.memory.lastPos !== undefined) {
        	if((creep.pos.x === creep.memory.lastPos.x && creep.pos.y === creep.memory.lastPos.y) && creep.fatigue === 0) {
        		this.recalculatePath(creep);
        	}
        }
    
    	result = creep.moveByPath(creep.memory.path);
    
    	if(result === OK) {
    		creep.memory.lastPos = creep.pos;
    	} else if(result === ERR_NOT_FOUND) {
    		this.recalculatePath(creep);
    		result = creep.moveByPath(creep.memory.path);
    	}
    
    	return result;
    },
    
    work: function(target, creep) {
        var result;
        if(creep.memory.working) {
            if(target.structureType === STRUCTURE_STORAGE) {
                var resource;
                for(let r in creep.carry) {
                    if(creep.carry[r] > 0) {
                        resource = r;
                        break;
                    }
                }
                result = creep.transfer(target, resource, creep.carry[resource]);
            } else {
                result = creep.transfer(target, RESOURCE_ENERGY);
            }
            
            creep.memory.target = null;
            
            return result;
        } else {
            if(target.store !== undefined) {
                if(target.store[RESOURCE_ENERGY] > creep.carryCapacity - _.sum(creep.carry)) {
                    result = creep.withdraw(target, RESOURCE_ENERGY, creep.carryCapacity - _.sum(creep.carry));
                } else {
                    result = creep.withdraw(target, RESOURCE_ENERGY, target.store[RESOURCE_ENERGY]);
                }
                
                if(result !== OK)
                    this.findTarget(creep);
                
                return result;
            } else {
                result = creep.pickup(target);
                if(result !== OK) {
                    this.findTarget(creep);
                }
                return result;
            }
        }
    }
};

module.exports = roleCollector;