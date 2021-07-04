var tower = {
    run: function(tower) {
        var hostileAttackCreeps = tower.room.find(FIND_HOSTILE_CREEPS, { 
            filter: (c) => (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0) && !(c.owner.username === '' || c.owner.username === 'Mordox' || c.owner.username === '0xDEADFEED' || c.owner.username === 'Nisou' || c.owner.username === 'kormac' || c.owner.username === 'Enrico')
        });
        var targets = this.getTargets(hostileAttackCreeps, tower , 4);
        var healers = _.filter(tower.room.find(FIND_HOSTILE_CREEPS), c => c.getActiveBodyparts(HEAL) > 0);
        
        for(let target of targets) {
            for(let healer of healers) {
                if(target.id !== healer.id && target.pos.isNearTo(healer)) {
                    
                    var index = targets.indexOf(target);
                    if(index != -1)
                        targets.splice(index, 1);
                }
            }
        }
        
        if(targets.length > 0) {
            var target = tower.pos.findClosestByRange(targets);
            tower.attack(target);
        } else {
            var hostileCreeps = _.filter(tower.room.find(FIND_HOSTILE_CREEPS), c => !(c.owner.username === 'Remco' || c.owner.username === 'Mordox' || c.owner.username === '0xDEADFEED' || c.owner.username === 'Nisou' || c.owner.username === 'kormac' || c.owner.username === 'Enrico') && !(c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0));
            var targets = this.getTargets(hostileCreeps, tower, 4);
            
            if(targets.length > 0) {
                var target = tower.pos.findClosestByRange(hostileCreeps);
                tower.attack(target);
            } else {
                var damagedAttackCreeps = tower.room.find(FIND_MY_CREEPS, {
                    filter: (c) => c.hits < c.hitsMax && (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0)
                });
                
                if(damagedAttackCreeps.length > 0) {
                    var target = damagedAttackCreeps[0];
                    
                    for(let c of damagedAttackCreeps) {
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
                        
                        for(let c of damagedCreeps) {
                            if((c.hits / c.hitsMax) < (target.hits / target.hitsMax)) {
                                target = c;
                            }
                        }
                        tower.heal(target);
                    } else {
                        var rampart = tower.room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_RAMPART })[0];
                        var maxHits;
                        
                        if(rampart == undefined) {
                            // maxHits = 250000;
                            maxHits = 60000;
                        } else {
                            maxHits = rampart.hitsMax;
                        }
                        
                        // if(maxHits > tower.room.controller.level * 250000)
                        //     maxHits = tower.room.controller.level * 250000;
                        if(maxHits > tower.room.controller.level * 60000)
                            maxHits = tower.room.controller.level * 60000;
                        
                        var damagedStructures = tower.room.find(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_RAMPART && s.hits < maxHits) 
                            || (s.hits / s.hitsMax < 0.33 && !(s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART)) 
                            || (s.structureType === STRUCTURE_WALL && s.hits < maxHits && s.hitsMax > 1)
                        });
                        
                        if(damagedStructures.length > 0 && tower.energy > (tower.energyCapacity * 0.66)) {
                            var target = damagedStructures[0];
                            
                            for(let s of damagedStructures) {
                                if((s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && (target.structureType === STRUCTURE_WALL || target.structureType === STRUCTURE_RAMPART)) {
                                    if(wallPercentage(s, maxHits) < wallPercentage(target, maxHits)) {
                                        target = s;
                                    }
                                } else if((s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && !(target.structureType === STRUCTURE_WALL || target.structureType === STRUCTURE_RAMPART)) {
                                    if(wallPercentage(s, maxHits) < target.hits / target.hitsMax) {
                                        target = s;
                                    }
                                } else if(!(s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && (target.structureType === STRUCTURE_WALL || target.structureType === STRUCTURE_RAMPART)) {
                                    if(s.hits / s.hitsMax < wallPercentage(target, maxHits)) {
                                        target = s;
                                    }
                                } else {
                                    if(s.hits / s.hitsMax < target.hits / target.hitsMax) {
                                        target = s;
                                    }
                                }
                            }
                            
                            tower.repair(target);
                        }
                    }
                }
            }
        }
    },
    
    getTargets: function(hCreeps, tower, rng = 4) {
        var targets = [];
        // hCreeps = _.filter(hCreeps, c => c.getActiveBodyparts(ATTACK) > 0 || 
        //         c.getActiveBodyparts(RANGED_ATTACK) > 0 || 
        //         c.getActiveBodyparts(HEAL) > 0 || 
        //         c.getActiveBodyparts(WORK) > 0);
        
        for(let h of hCreeps) {
            var x = h.pos.x;
            var xMin = x - rng;
            var xMax = x + rng;
            
            if(xMin < 0)
                xMin = 0;
            
            if(xMax > 49)
                xMax = 49;
            
            var y = h.pos.y;
            var yMin = y - rng;
            var yMax = y + rng;
            
            if(yMin < 0)
                yMin = 0;
            
            if(yMax > 49)
                yMax = 49;
            
            var allCreeps = tower.room.lookForAtArea(LOOK_CREEPS, (yMin), (xMin), (yMax), (xMax), true);
            var myCreeps = _.filter(allCreeps, c => c.creep.my);
            if(myCreeps.length > 0) {
                targets.push(h);
            } else {
                var allStructures = tower.room.lookForAtArea(LOOK_STRUCTURES, (yMin), (xMin), (yMax), (xMax), true);
                var defendedStructures = _.filter(allStructures, s => s.structure.structureType !== STRUCTURE_ROAD);
                if(defendedStructures.length > 0) {
                    targets.push(h);
                }
            }
        }
        return targets;
    }
};

module.exports = tower;

function wallPercentage(structure, max) {
    return structure.hits / (structure.hitsMax - (structure.hitsMax - max));
}