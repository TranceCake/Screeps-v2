tower = {
    run: function(tower) {
        var hostileAttackCreeps = tower.room.find(FIND_HOSTILE_CREEPS, { 
            filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
        });
        
        if(hostileAttackCreeps.length > 0) {
            var target = tower.pos.findClosestByRange(hostileAttackCreeps);
            tower.attack(target);
        } else {
            var hostileCreeps = tower.room.find(FIND_HOSTILE_CREEPS);
            
            if(hostileCreeps.length > 0) {
                var target = tower.pos.findClosestByRange(hostileCreeps);
                tower.attack(target);
            } else {
                var hostileStructures = tower.room.find(FIND_HOSTILE_STRUCTURES);
                var hostileConstructionSites = tower.room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
                
                if(hostileConstructionSites.length > 0) {
                    for(h of hostileConstructionSites) {
                        hostileStructures.push(h);
                    }
                }
                
                if(hostileStructures.length > 0) {
                    var target = tower.pos.findClosestByRange(hostileStructures);
                    tower.attack(target);
                } else {
                    var damagedAttackCreeps = tower.room.find(FIND_MY_CREEPS, {
                        filter: (c) => c.hits < c.hitsMax && (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0)
                    });
                    
                    if(damagedAttackCreeps.length > 0) {
                        var target = damagedAttackCreeps[0];
                        
                        for(c of damagedAttackCreeps) {
                            if((c.hits / c.hitsMax) < (target.hits / target.hitsMax)) {
                                target = c;
                            }
                        }
                        tower.heal(target);
                    } else {
                        var damagedCreeps = tower.room.find(FIND_MY_CREEPS, {
                            filter: (c) => c.hits < c.hitsMax
                        });
                        
                        if(damagedCreeps.length > 0) {
                            var target = damagedCreeps[0];
                            
                            for(c of damagedCreeps) {
                                if((c.hits / c.hitsMax) < (target.hits / target.hitsMax)) {
                                    target = c;
                                }
                            }
                            tower.heal(target);
                        } else {
                            var rampart = tower.room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_RAMPART })[0];

                            if(rampart == undefined) {
                                var rampartHitsMax = 1000000;
                            } else {
                                var rampartHitsMax = rampart.hitsMax;
                            }
                            
                            var damagedStructures = tower.room.find(FIND_STRUCTURES, {
                                filter: (s) => (s.structureType === STRUCTURE_RAMPART) 
                                || (s.hits / s.hitsMax < 0.33 && s.structureType !== STRUCTURE_WALL) 
                                || (s.structureType === STRUCTURE_WALL && s.hits < rampartHitsMax)
                            });
                            
                            if(damagedStructures.length > 0) {
                                var target = damagedStructures[0];
                                
                                for(s of damagedStructures) {
                                    if(s.structureType === STRUCTURE_WALL && target.structureType === STRUCTURE_WALL) {
                                        if(wallPercentage(s, rampartHitsMax) < wallPercentage(target, rampartHitsMax)) {
                                            target = s;
                                        }
                                    } else if(s.structureType === STRUCTURE_WALL && target.structureType !== STRUCTURE_WALL) {
                                        if(wallPercentage(s, rampartHitsMax) < target.hits / target.hitsMax) {
                                            target = s;
                                        }
                                    } else if(s.structureType !== STRUCTURE_WALL && target.structureType === STRUCTURE_WALL) {
                                        if(s.hits / s.hitsMax < wallPercentage(target, rampartHitsMax)) {
                                            target = s;
                                        }
                                    } else {
                                        if(s.hits / s.hitsMax < target.hits / target.hitsMax) {
                                            target = s;
                                        }
                                    }
                                }
                                if(tower.energy > (tower.energyCapacity * 0.66))
                                    tower.repair(target);
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = tower;

function wallPercentage(structure, max) {
    return structure.hits / (structure.hitsMax - (structure.hitsMax - max));
}





