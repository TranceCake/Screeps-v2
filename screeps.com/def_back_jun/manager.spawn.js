var roleMiner = require('role.miner');
var roleCollector = require('role.collector');
var roleDefender = require('role.defender');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

var remoteManager = require('manager.remoteMining');

var spawnManager = {

    /** @param {Spawn} spawn **/
    run: function(spawn) {
        if(_.isObject(spawn.spawning)) {
            return;
        }
        
        //===== INITIAL VARIABLES =====\\
        var memSources = spawn.room.memory.sources;
        var sourceIds = Object.keys(memSources);
        var creepsInRoom = _.filter(Game.creeps, creep => creep.room.name === spawn.room.name);
        var localStructures = spawn.room.find(FIND_STRUCTURES);
        var capacity = spawn.room.energyCapacityAvailable;
        var available = spawn.room.energyAvailable;

        //if(spawn.memory.sourcePaths === undefined) {
            this.calculatePathsToSources(spawn);
        //}
        
        //===== MINER PREP CODE
        var miners = _.filter(creepsInRoom, creep => creep.memory.role === 'miner');
        var miningCreeps = _.filter(miners, miner => miner.memory.sourceId !== undefined);
        var emptySources = [];
        
        if(miningCreeps.length > 0) {
            for(let creep of miningCreeps) {
                var i = sourceIds.indexOf(creep.memory.sourceId);
                if(i != -1) {
                    sourceIds.splice(i, 1);
                }
            }
            emptySources = sourceIds;
        } else {
            emptySources = sourceIds;
        }
        
        //===== STARTUP/RECOVERY MINER
        if(miners.length === 0) {
            var sourceContainer = _.filter(Game.getObjectById(emptySources[0]).room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER && s.pos.isNearTo(Game.getObjectById(emptySources[0])))[0];
            if(sourceContainer === undefined) {
                var id = null;
            } else {
                var id = sourceContainer.id;
            }
            return this.spawnCreep(spawn, roleMiner.getBody(available), 'miner', { sourceId: emptySources[0], sourceContainer: id });
        }
        
        //===== STARTUP/RECOVERY COLLECTOR
        var collectors = _.filter(creepsInRoom, creep => creep.memory.role === 'collector');
        var minCollectors = Object.keys(memSources).length;
        
        var availableEnergy = _.sum(_.filter(localStructures, s => s.structureType === STRUCTURE_CONTAINER), c => c.store[RESOURCE_ENERGY]) + _.sum(_.filter(spawn.room.find(FIND_DROPPED_RESOURCES), e => e.resourceType === RESOURCE_ENERGY), e => e.amount);
        minCollectors += Math.floor(availableEnergy / 1000);
        
        if(collectors.length === 0 && miners.length === 1)
            return this.spawnCreep(spawn, roleCollector.getBody(available), 'collector', { working: false });
        
        //===== DEFENDERS
        let hostiles = _.filter(spawn.room.find(FIND_HOSTILE_CREEPS), c => c.owner.username !== "TuN9aN0");
        if(hostiles.length > 0) {
            var defenders = _.filter(creepsInRoom, creep => creep.memory.role === 'defender');
            var minDefenders = hostiles.length;
            
            if(defenders.length < minDefenders) {
                return this.spawnCreep(spawn, roleDefender.getBody(available), 'defender');
            }
        }
        
        //===== MINERS
        if(miners.length == 2) {
            for(let miner of miners) {
                if(!miner.spawning && !miner.memory.replaced) {
                    let sourceId = miner.memory.sourceId;
                    let ttl = miner.ticksToLive;
    
                    if(ttl <= (spawn.memory.sourcePaths[sourceId] * 3) + 18 + 5) {
                        let sourceContainer = _.filter(spawn.room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER
                                && s.pos.isNearTo(Game.getObjectById(sourceId)))[0]; 
                        let id = (sourceContainer === undefined ? null : sourceContainer.id);
                        let bodySize = (capacity >= 550 ? 550 : available);
    
                        let result = this.spawnCreep(spawn, roleMiner.getBody(bodySize), 'miner', { sourceId: sourceId, sourceContainer: id, replaced: false });
                        if(result === OK) {
                            miner.memory.replaced = true;
                        }
                        return result;
                    }
                }
            }
        } else if(miners.length == 1) {
            let sourceId = emptySources[0];
            var sourceContainer = _.filter(Game.getObjectById(emptySources[0]).room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER
                    && s.pos.isNearTo(Game.getObjectById(emptySources[0])))[0];
            let id = (sourceContainer === undefined ? null : sourceContainer.id);
            
            return this.spawnCreep(spawn, roleMiner.getBody(available), 'miner', { sourceId: sourceId, sourceContainer: id });
        }
        
        //===== COLLECTORS
        var remoteSpawnFlags = _.filter(Game.flags, f => f.name.includes('RemoteSpawn-'));
        //console.log(remoteSpawnFlags)
        if(_.some(remoteSpawnFlags, f => f.room.name === spawn.room.name) === true)
            minCollectors += 2;
        
        //console.log(minCollectors)
        if(collectors.length < minCollectors)
            return this.spawnCreep(spawn, roleCollector.getBody(available), 'collector', { working: false });
        
        //===== UPGRADERS
        var upgraders = _.filter(creepsInRoom, creep => creep.memory.role === 'upgrader');
        var minUpgraders = 4;
        
        
        if(spawn.room.controller.level === 2) {
            minUpgraders = 5;
        } else if(spawn.room.controller.level === 4) {
            minUpgraders = 3;
        } else if(spawn.room.controller.level < 7 && spawn.room.controller.level > 4) {
            minUpgraders = 2;
        } else if(spawn.room.controller.level >= 7) {
            minUpgraders = 1;
        }

        minUpgraders += Math.floor(availableEnergy / 1500);
        
        if((upgraders.length < minUpgraders || (minUpgraders === 1 && upgraders.length === 1 && upgraders[0].ticksToLive < 150)) && spawn.room.memory.threatLevel === 0)
            return this.spawnCreep(spawn, roleUpgrader.getBody(available, spawn.room.controller.level), 'upgrader', { flag: spawn.room.name + '-Upgrade' });
        
        //===== LINKFILLERS
        var links = _.filter(spawn.room.find(FIND_MY_STRUCTURES), s => s.structureType === STRUCTURE_LINK);
        var linkFillers =  _.filter(creepsInRoom, creep => creep.memory.role === 'linkFiller');
        
        if(links.length > 1 && spawn.room.storage !== undefined) {
            var minLinkFillers = 1;
            
            if(linkFillers.length < minLinkFillers  && spawn.room.memory.threatLevel === 0)
                return this.spawnCreep(spawn, [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE], 'linkFiller');
        }
        
        //===== BUILDERS
        if(spawn.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
            var minBuilders = 1;
            var maxBuilders = 4;
            var builders = _.filter(creepsInRoom, creep => creep.memory.role === 'builder');
            var sites = spawn.room.find(FIND_CONSTRUCTION_SITES);
            
            minBuilders += Math.floor(sites.length / 10) + 1;
            
            if(minBuilders > maxBuilders)
                minBuilders = maxBuilders;
            
            if(builders.length < minBuilders && spawn.room.memory.threatLevel === 0)
                return this.spawnCreep(spawn, roleBuilder.getBody(available), 'builder', { idle: false });
        }
        
        //===== MINERAL MINERS
        var extractor = _.filter(localStructures, s => s.structureType === STRUCTURE_EXTRACTOR)[0];
        if(!!spawn.room.storage && !!extractor) {
            var mineralMiners = _.filter(creepsInRoom, c => c.memory.role === 'mineralMiner');
            var minMineralMiners = 1;
            var mineral = extractor.pos.lookFor(LOOK_MINERALS)[0];
            
            if(mineralMiners.length < minMineralMiners && mineral.mineralAmount > 0) {
                return this.spawnCreep(spawn, [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'mineralMiner', { working: true, mineralId: mineral.id, mineralType: mineral.mineralType, spawnId: spawn.id });
            }
        }
        
        //===== ATTACKERS
        if(Game.flags['Attack'] !== undefined) {
            this.spawnAttacker(spawn);
        }
        
        //===== CLAIMERS
        if(Game.flags['Claim'] !== undefined && Game.flags['ClaimSpawn'] !== undefined) {
            this.spawnClaimer(spawn);
        }
        
        //===== REMOTEBUILDERS
        if(Game.flags['Spawn'] !== undefined && Game.flags['RemoteBuilderSpawn'] !== undefined) {
            this.spawnRemoteBuilder(spawn);
        }
        
        //===== DRAINERS
        if(Game.flags['Drain'] !== undefined) {
            var drainers = _.filter(Game.creeps, creep => creep.memory.role === 'drainer');
            var minDrainers = 2;
            
            if(drainers.length < minDrainers)
                return this.spawnCreep(spawn, [TOUGH, TOUGH, TOUGH, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'drainer');
        }
        
        //===== TANKS
        if(Game.flags['Tank'] !== undefined) {
            var tanks = _.filter(Game.creeps, creep => creep.memory.role === 'tank');
            var minTanks = 1;
            
            if(tanks.length < minTanks)
                return this.spawnCreep(spawn, [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'tank');
        }
        
        //===== RAIDERS
        if(Game.flags['Raid'] !== undefined && Game.flags['RaidSpawn'] !== undefined) {
            this.spawnRaider(spawn);
        }
        
        //===== REMOTES
        var remoteFlags = _.filter(Game.flags, f => f.name.includes('Remote-'));
        
        if(remoteFlags.length > 0) {
            for(let flag of remoteFlags) {
                var number = parseInt(flag.name.substr(flag.name.length - 1), 10);
                var spawnFlag = Game.flags['RemoteSpawn-' + number];
                if(spawn.room.name === spawnFlag.room.name) {
                    var remote = flag.room;
                    var spawnType = remoteManager.run(number);
                    //console.log(spawnType)
                    switch(spawnType) {
                        case 'keeper':
                            return this.spawnCreep(spawn, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL], 'peaceKeeper', { remote: number });
                            break;
                            
                        case 'miner':
                            var miners = _.filter(Game.creeps, c => c.memory.role === 'remoteMiner' && c.memory.remote === number);
                            if(!! remote) {
                                var sources = remote.find(FIND_SOURCES);
                                
                                var minedSourceIds = [];
                                var sourceId;
                                var lairId;
                                
                                for(let miner of miners) {
                                    minedSourceIds.push(miner.memory.sourceId);
                                }
                                
                                for(let source of sources) {
                                    if(minedSourceIds.indexOf(source.id) === -1) {
                                        sourceId = source.id;
                                        lairId = source.pos.findClosestByRange(source.room.find(FIND_HOSTILE_STRUCTURES)).id;
                                        break;
                                    }
                                }
                                
                                return this.spawnCreep(spawn, [TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, HEAL, HEAL], 'remoteMiner', { working: true, remote: number, sourceId: sourceId, lairId: lairId });
                            }
                            break;
                        
                        case 'collector':
                            return this.spawnCreep(spawn, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, WORK, MOVE], 'remoteCollector', { working: true, remote: number });
                            break;
                            
                        case 'nothing':
                            break;
                    }
                }
            }
        }
        
        return 'nothing to spawn..';
	},
	
	spawnCreep: function(spawn, body, role, mem = {}) {
	    var result = spawn.createCreep(body, undefined, _.assign(mem, { role: role }));
	    
	    if(_.isString(result)) {
            console.log(spawn.name + ' in ' + spawn.room.name + ' spawned new ' + role + ', ' + result + ' [' + body + ']');
            return result;
        } else {
            //console.log(spawn.name + ' in ' + spawn.room.name + ' failed to spawn new ' + role + ', err: ' + result);
            return null;
        }
    },
    
    calculatePathsToSources: function(spawn) {
        sources = spawn.room.find(FIND_SOURCES);
        spawn.memory.sourcePaths = {};

        for(source of sources) {
            let distance = spawn.room.findPath(spawn.pos, source.pos, {serialize: true}).length;
            let sourceId = source.id;

            Object.assign(spawn.memory.sourcePaths, { [sourceId]: distance } );
        }
    },

    spawnAttacker: function(spawn) {
        if(Game.flags['AttackSpawn1'] !== undefined || Game.flags['AttackSpawn2'] !== undefined) {
            var flags = _.filter(Game.flags, f => f.name === 'AttackSpawn1' || f.name === 'AttackSpawn2');
            
            for(let flag of flags) {
                if(flag.room.name !== undefined && flag.room.name === spawn.room.name) {
                    var attackers = _.filter(Game.creeps, creep => creep.memory.role === 'attacker');
                    var minAttackers = 4;
                    
                    if(attackers.length < minAttackers) {
                        // return this.spawnCreep(spawn, [TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE], 'attacker');
                        return this.spawnCreep(spawn, [TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL, HEAL], 'attacker');
                    }
                }
            }
        } else {
            console.log('No AttackSpawn flag is present, aborting attacker spawn...')
        }
    },

    spawnClaimer: function(spawn) {
        var flag = Game.flags['ClaimSpawn'];
            
        if(flag.room.name !== undefined && flag.room.name === spawn.room.name) {
            var claimers = _.filter(Game.creeps, creep => creep.memory.role === 'claimer');
            var minClaimers = 1;
        
            if(claimers.length < minClaimers && spawn.room.memory.threatLevel === 0)
                return this.spawnCreep(spawn, [TOUGH, MOVE, TOUGH, MOVE, CLAIM, MOVE], 'claimer');
        }
    },

    spawnRemoteBuilder: function(spawn) {
        var flag = Game.flags['RemoteBuilderSpawn'];
            
        if(flag.room.name !== undefined && flag.room.name === spawn.room.name) {
            var spawnBuilders = _.filter(Game.creeps, creep => creep.memory.role === 'remoteBuilder');
            var minSpawnBuilders = 4;
            
            if(spawnBuilders.length < minSpawnBuilders && spawn.room.memory.threatLevel === 0)
                // return this.spawnCreep(spawn, [TOUGH, MOVE, TOUGH, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, HEAL, MOVE, HEAL, MOVE], 'spawnBuilder', { working: false });
                return this.spawnCreep(spawn, [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY],
                    'remoteBuilder', { working: false });
        }
    },

    spawnRaider: function(spawn) {
        var flag = Game.flags['RaidSpawn'];
            
        if(flag.room.name !== undefined && flag.room.name === spawn.room.name) {
            var raiders = _.filter(Game.creeps, creep => creep.memory.role === 'raider');
            var minRaiders = 4;
            
            if(raiders.length < minRaiders)
                return this.spawnCreep(spawn, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], 'raider', { working: true, waypoint: 1 });
        }
    }
};

module.exports = spawnManager;