global.log = require('prototype.log');

var roleMiner = require('role.miner');
var roleCollector = require('role.collector');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var spawnManager = require('manager.spawn');
var logisticsManager = require('manager.logistics');
var roleDefender = require('role.defender');
var tower = require('tower');
var link = require('link');
var terminal = require('terminal');
var roleLinkFiller = require('role.linkFiller');
var roleAttacker = require('role.attacker');
var roleClaimer = require('role.claimer');
var roleRemoteBuilder = require('role.remoteBuilder');
var roleDrainer = require('role.drainer');
var roleTank = require('role.tank');
var roleRaider = require('role.raider');
var roleKeeper = require('role.peaceKeeper');
var roleRemoteMiner = require('role.remoteMiner');
var roleRemoteCollector = require('role.remoteCollector');
var roleMineralMiner = require('role.MineralMiner');

module.exports.loop = function () {

    _.forEach(Game.rooms, room => {
        if(_.isUndefined(room.memory.sources)) {
            room.memory.sources = {};
            
            var sources = room.find(FIND_SOURCES);
            console.log(sources)
            
            for(let source of sources) {
                Object.assign(room.memory.sources, { [source.id]: {} } );
            }
            
            var spawn = _.filter(Game.spawns, spawn => spawn.room.name === room.name);
            _.forEach(room.memory.sources, function(source, id) {
                if(_.isUndefined(source.range) && spawn.length > 0) {
                    _.set(room.memory.sources[id], 'range', spawn[0].pos.findPathTo(Game.getObjectById(id)).length);
                }
            });
        }

        var hostiles = _.filter(room.find(FIND_HOSTILE_CREEPS), c => (c.getActiveBodyparts(ATTACK).length > 0 || c.getActiveBodyparts(RANGED_ATTACK).length > 0 || c.getActiveBodyparts(HEAL).length > 0));
        if(hostiles.length > 0 && room.memory.threatLevel === 0) {
            room.memory.threatLevel = 1;
            if(!(hostiles[0].owner.username === 'Invader' || hostiles[0].owner.username === 'Source Keeper' || hostiles[0].owner.username === 'Remco' || hostiles[0].owner.username === 'Mordox' || hostiles[0].owner.username === '0xDEADFEED' || hostiles[0].owner.username === 'Nisou' || hostiles[0].owner.username === 'kormac' || hostiles[0].owner.username === 'Enrico')) {
                Game.notify('Hostile activity detected in: ' + room.name + '! \n' + 
                            'Origin: ' + hostiles[0].owner.username + '\n' +
                            'Amount: ' + hostiles.length, 0);
            }
            
            if(!hostiles[0].owner.username === 'Source Keeper') {
                log.warn('Hostile activity detected in: ' + room.name + '! \n' + 
                         'Origin: ' + hostiles[0].owner.username + '\n' +
                         'Amount: ' + hostiles.length, 0);
            }
            
        } else if(hostiles.length === 0 && room.memory.threatLevel === 1 || room.memory.threatLevel === undefined) {
            room.memory.threatLevel = 0;
        }

        logisticsManager.getRoomSupply(room);
        
    });
    
    // garbage collection
    for(var name in Memory.creeps) {
        if(Game.creeps[name] == undefined)
            delete Memory.creeps[name];
    }

    // executing jobs for all creeps
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.room.memory.threatLevel === 0 || !creep.room.controller || !creep.room.controller.owner || ((creep.room.controller && creep.room.controller.owner && creep.room.controller.owner.username !== 'TranceCake') && creep.room.memory.threatLevel === 1)) {
            if(!creep.spawning) {
                if(creep.memory.role == 'miner') {
                    roleMiner.run(creep);
                } else if(creep.memory.role == 'collector') {
                    roleCollector.run(creep);
                } else if(creep.memory.role == 'builder') {
                    roleBuilder.run(creep);
                } else if(creep.memory.role == 'upgrader') {
                    roleUpgrader.run(creep);
                } else if(creep.memory.role == 'defender') {
                    roleDefender.run(creep);
                } else if(creep.memory.role == 'linkFiller') {
                    roleLinkFiller.run(creep);
                } else if(creep.memory.role == 'attacker') {
                    roleAttacker.run(creep);
                } else if(creep.memory.role == 'claimer') {
                    roleClaimer.run(creep);
                } else if(creep.memory.role == 'remoteBuilder') {
                    roleRemoteBuilder.run(creep);
                } else if(creep.memory.role == 'drainer') {
                    roleDrainer.run(creep);
                } else if(creep.memory.role == 'tank') {
                    roleTank.run(creep);
                } else if(creep.memory.role == 'raider') {
                    roleRaider.run(creep);
                } else if(creep.memory.role == 'peaceKeeper') {
                    roleKeeper.run(creep);
                } else if(creep.memory.role == 'remoteMiner') {
                    roleRemoteMiner.run(creep);
                } else if(creep.memory.role == 'remoteCollector') {
                    roleRemoteCollector.run(creep);
                } else if(creep.memory.role == 'mineralMiner') {
                    roleMineralMiner.run(creep);
                }
            }
        } else {
            if(creep.memory.role == 'miner') {
                roleMiner.run(creep);
            } else if(creep.memory.role == 'collector') {
                roleCollector.run(creep);
            } else if(creep.memory.role == 'defender') {
                roleDefender.run(creep);
            } else if(creep.memory.role == 'linkFiller') {
                roleLinkFiller.run(creep);
            } else if(creep.memory.role == 'attacker') {
                roleAttacker.run(creep);
            } else if(creep.memory.role == 'drainer') {
                roleDrainer.run(creep);
            } else if(creep.memory.role == 'tank') {
                roleTank.run(creep);
            } else if(creep.memory.role == 'peaceKeeper') {
                roleKeeper.run(creep);
            } else if(creep.memory.role == 'remoteMiner') {
                roleRemoteMiner.run(creep);
            } else if(creep.memory.role == 'remoteCollector') {
                roleRemoteCollector.run(creep);
            } else if(creep.memory.role == 'mineralMiner') {
                roleMineralMiner.run(creep);
            } else if(creep.memory.role == 'spawnBuilder') {
                roleSpawnBuilder.run(creep);
            } else if(creep.memory.role == 'upgrader') {
                roleUpgrader.run(creep);
            }
        }
    }
    
    _.forEach(Game.spawns, spawn => {
        spawn.memory.result = spawnManager.run(spawn);
    });
    
    // executing jobs for all towers
    var towers = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_TOWER);
    if(towers.length > 0) {
        for(let t of towers) {
            tower.run(t);
        }
    }
    
    // executing jobs for all links
    var links = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_LINK);
    if(towers.length > 0) {
        for(let l of links) {
            link.run(l);
        }
    }
    
    var terminals = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_TERMINAL);
    if(terminals.length > 0) {
        var boosted = Game.flags['Boost'];
        for(let tm of terminals) {
            terminal.run(tm, boosted);
        }
    }
}





