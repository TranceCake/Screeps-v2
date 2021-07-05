var roleAttacker = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var result;
        var marker = Game.flags['Attack'];
        var hold = Game.flags['Attack-Hold'];
        var priority = Game.flags['Priority'];
        
        if(hold === undefined) {
            if(marker !== undefined) {
                if(marker.room !== undefined && marker.room.name === creep.room.name) {
                    if(priority !== undefined) {
                        var targets = creep.room.lookAt(priority.pos);
                        var target = _.filter(targets, t => t.type === 'structure')[0];
                        
                        if(target !== undefined) {
                            if(creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                                if(creep.rangedAttack(target.structure) === ERR_NOT_IN_RANGE) {
                                    result = creep.moveTo(target.structure);
                                    if(result === ERR_NO_PATH) {
                                        var path = this.getPath(creep, target.structure);
                                        result = creep.moveByPath(path);
                                    }
                                } else {
                                    result = creep.rangedAttack(target.structure);
                                }
                            } else {
                                if(creep.attack(target.structure) === ERR_NOT_IN_RANGE) {
                                    result = creep.moveTo(target.structure);
                                    if(result === ERR_NO_PATH) {
                                        var path = this.getPath(creep, target.structure);
                                        result = creep.moveByPath(path);
                                    }
                                } else {
                                    result = creep.attack(target.structure);
                                }
                            }
                        }
                    } else {
                        var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
                        var hostileAttackCreeps = _.filter(creep.room.find(FIND_HOSTILE_CREEPS), c => (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0 || c.getActiveBodyparts(HEAL) > 0)); // || c.name ==='nextroomer-9450'
                        var hostileStructures = _.filter(creep.room.find(FIND_HOSTILE_STRUCTURES), s => s.structureType !== STRUCTURE_CONTROLLER && s.room.lookForAt(LOOK_FLAGS, s.pos.x, s.pos.y).length === 0);
                        var damagedAllies = _.filter(creep.room.find(FIND_CREEPS), c => c.hits < c.hitsMax);
                        
                        if(hostileAttackCreeps.length > 0) {
                            if(creep.attack(hostileAttackCreeps[0]) === ERR_NOT_IN_RANGE || creep.rangedAttack(hostileAttackCreeps[0]) === ERR_NOT_IN_RANGE) {
                                result = creep.moveTo(hostileAttackCreeps[0]);
                                
                                if(result === ERR_NO_PATH) {
                                    var path = this.getPath(creep, hostileAttackCreeps[0]);
                                    result = creep.moveByPath(path);
                                }
                            } else {
                                var nearbyCreeps = creep.room.lookForAtArea(LOOK_CREEPS, creep.pos.y - 3, creep.pos.x - 3, creep.pos.y + 3, creep.pos.x + 3, true);
                                var nearbyHostiles = [];
                                
                                for(let creep of nearbyCreeps) {
                                    if(!creep.creep.my)
                                        nearbyHostiles.push(creep.creep);
                                }
    
                                if(creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                                    if(nearbyHostiles.length > 3) {
                                        creep.rangedMassAttack();
                                    } else {
                                        // let target = nearbyHostiles[0];
                                        // let parts = target.getActiveBodyparts(ATTACK).length;//.concat(target.getActiveBodyparts(RANGED_ATTACK)).length;

                                        // for(c of nearbyCreeps) {
                                        //     var value = c.getActiveBodyparts(ATTACK).length;//.concat(target.getActiveBodyparts(RANGED_ATTACK)).length;
                                        //     if(value > parts) {
                                        //         target = creep;
                                        //         parts = value;
                                        //     }
                                        // }

                                        result = creep.rangedAttack(nearbyHostiles[0]);
                                    }
                                } else {
                                    result = creep.attack(hostileAttackCreeps[0]);
                                }
                            }
                        } else if(hostileCreeps.length > 0) {
                            if(creep.attack(hostileCreeps[0]) === ERR_NOT_IN_RANGE || creep.rangedAttack(hostileCreeps[0]) === ERR_NOT_IN_RANGE) {
                                result = creep.moveTo(hostileCreeps[0]);
                                if(result === ERR_NO_PATH) {
                                    var path = creep.room.findPath(creep.pos, hostileCreeps[0].pos, {ignoreDestructibleStructures: true});
                                    result = creep.moveByPath(path);
                                    console.log('res: ' + result)
                                }
                            } else {
                                result = creep.rangedAttack(hostileCreeps[0]);
                            }
                        } else if(hostileStructures.length > 0) {
                            if(creep.attack(hostileStructures[0]) === ERR_NOT_IN_RANGE) {
                                result = creep.moveTo(hostileStructures[0]);
                                if(result === ERR_NO_PATH) {
                                    var path = this.getPath(creep, hostileStructures[0]);
                                    result = creep.moveByPath(path);
                                }
                            } else {
                                if(creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                                    result = creep.rangedAttack(hostileStructures[0]);
                                } else {
                                    result = creep.attack(hostileStructures[0]);
                                }
                            }
                        } else if (creep.getActiveBodyparts(HEAL) > 0 && damagedAllies.length > 0) {
                            let creep_to_heal = damagedAllies[0]
                            if(!creep.pos.isNearTo(creep_to_heal)) {
                                result = creep.moveTo(creep_to_heal);
                            } else {
                                result = creep.attack(creep.heal(damagedAllies[0]));
                            }
                            
                        } else {
                            if(!creep.pos.isNearTo(Game.flags['Idle'])) {
                                result = creep.moveTo(Game.flags['Idle']);
                            }
                        }
                    }
                } else {
                    result = creep.moveTo(marker);
                }
            } else {
                if(!creep.pos.isNearTo(Game.flags['Idle'])) {
                    result = creep.moveTo(Game.flags['Idle']);
                }
            }
        } else {
            if(!creep.pos.isNearTo(hold)) {
                result = creep.moveTo(hold);
            }
        }
        creep.memory.result = result;
        creep.heal(creep);
    },
    
    getPath: function(creep, hostile) {
        return creep.room.findPath(creep.pos, hostile.pos, {'ignoreDestructibleStructures': true});
    }
};

module.exports = roleAttacker;