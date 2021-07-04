var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleRepairer = require('role.repairer');
var roleDefender = require('role.defender');
var tower = require('tower');

var minHarvesters;
var minDefenders;
var minUpgraders;
var minBuilders;
var minRepairers;

module.exports.loop = function () {
    
    // garbage collection
    for(var name in Memory.creeps) {
        if(Game.creeps[name] == undefined)
            delete Memory.creeps[name];
    }

    // executing jobs for all creeps
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(!creep.spawning) {
            if(creep.memory.role == 'harvester') {
                roleHarvester.run(creep);
            }
            if(creep.memory.role == 'builder') {
                roleBuilder.run(creep);
            }
            if(creep.memory.role == 'upgrader') {
                roleUpgrader.run(creep);
            }
            if(creep.memory.role == 'repairer') {
                roleRepairer.run(creep);
            }
            if(creep.memory.role == 'defender') {
                roleDefender.run(creep);
            }
        }
    }
    
    // executing jobs for all towers
    var towers = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_TOWER);
    if(towers.length > 0) {
        for(t of towers) {
            tower.run(t);
        }
    }
    
    //==== Auto spawning section ====\\
    
    // determining the number and type of creeps needed
    numMiningSites = findMiningSites(Game.spawns.Spawn1.room);
    
    // more than 5 mining sites is luxurious, so you can speed up production a bit
    if(numMiningSites > 5) {
        minHarvesters = 6;
        minUpgraders = 3;
        minBuilders = 4;
    } else {
        minHarvesters = 4;
        minUpgraders = 2;
        minBuilders = 3;
    }
    
    // the tower also repairs a bit so less repairers needed
    if(towers.length > 0) {
        minRepairers = 1;
    } else {
        minRepairers = 2;
    }
    
    // if there are hostile creeps in the room try outmatching their numbers by spawning more defenders
    if(Game.spawns.Spawn1.room.find(FIND_HOSTILE_CREEPS).length > 0) {
        minDefenders = Game.spawns.Spawn1.room.find(FIND_HOSTILE_CREEPS).length + 2;
    } else {
        minDefenders = 2;
    }
    
    // getting current creep load on the room
    var numHarvesters = getTotalRolePoints('harvester');
    var numDefenders = getTotalRolePoints('defender');
    var numUpgraders = getTotalRolePoints('upgrader');
    var numBuilders = getTotalRolePoints('builder');
    var numRepairers = getTotalRolePoints('repairer');
    
    // calculating max energy capacity and current reserves
    var capacity = Game.spawns.Spawn1.room.energyCapacityAvailable;
    var available = Game.spawns.Spawn1.room.energyAvailable;
    
    // determining which type of creep to spawn next, based on resources and need
    if(numHarvesters < minHarvesters) {
        if(numHarvesters == 0 && available < capacity) {
            spawn('harvester', available);
        } else {
            spawn('harvester', capacity);
        }
    } else if(numDefenders < minDefenders) {
        spawn('defender', capacity);
    } else if(numUpgraders < minUpgraders) {
        spawn('upgrader', capacity);
    } else if(numBuilders < minBuilders) {
        spawn('builder', capacity);
    } else if(numRepairers < minRepairers) {
        spawn('repairer', capacity);
    }
}

// spawn a custom creep, based on the max capacity of the room at the time
function spawn(role, capacity) {
    var parts;
    var tier;
    
    if(capacity < 550) {
        tier = 'basic';
        
        if(role === 'defender') {
            parts = [ATTACK, ATTACK, MOVE, MOVE];
        } else {
            parts = [WORK, WORK, CARRY, MOVE];
        }
    } else if(capacity < 800) {
        tier = 'advanced';
        
        if(role === 'defender') {
            parts = [ATTACK, ATTACK, ATTACK, TOUGH, MOVE, MOVE, MOVE, MOVE];
        } else {
            parts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
    } else if(capacity < 1300) {
        tier = 'elite';
        
        if(role === 'defender') {
            parts = [ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else {
            parts = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }
    }
    
    var name = Game.spawns.Spawn1.createCreep(parts, undefined, {role: role, working: false, tier: tier, result: 0});
        
    if(!(name < 0)) {
        console.log('// spawned new ' + tier + ' ' + role + ': ' + name);
        console.log('| # Harvesters: ' + roleFilter('harvester').length + ' - '  + getTotalRolePoints('harvester') + '/' + minHarvesters);
        console.log('| # Defenders: ' + roleFilter('defender').length + ' - '  + getTotalRolePoints('defender') + '/' + minDefenders);
        console.log('| # Upgraders: ' + roleFilter('upgrader').length + ' - ' + getTotalRolePoints('upgrader') + '/' + minUpgraders);
        console.log('| # Builders: ' + roleFilter('builder').length + ' - '  + getTotalRolePoints('builder') + '/' + minBuilders);
        console.log('| # Repairers: ' + roleFilter('repairer').length + ' - '  + getTotalRolePoints('repairer') + '/' + minRepairers);
        console.log('| # Creeps total: ' + (roleFilter('harvester').length + roleFilter('upgrader').length + roleFilter('builder').length + roleFilter('defender').length + roleFilter('repairer').length));
    }   
}

// filter by role
function roleFilter(role) {
    return _.filter(Game.creeps, (c) => c.memory.role == role);
}

// determines the number of points per role, based on creep size (tier)
function getTotalRolePoints(role) {
    var basic = _.sum(roleFilter(role), (c) => c.body.length <= 4);
    var advanced = _.sum(roleFilter(role), (c) => c.body.length > 4) * 1.5;
    return basic + advanced;
}

// function that get the number of free spots adjacent to all sources of the room. for future routing/queueing systems
function findMiningSites(roomToSearch) {
    var sources = roomToSearch.find(FIND_SOURCES);
    var sites = [];
    
    for(source of sources) {
        var x = source.pos.x;
        var y = source.pos.y;
        
        var adjacent = roomToSearch.lookForAtArea(LOOK_TERRAIN, (y - 1), (x - 1), (y + 1), (x + 1), true);
        var siteArray = _.filter(adjacent, (s) => s.terrain === 'plain' || s.terrain === 'swamp');
        
        for(site of siteArray) {
            sites.push(new RoomPosition(site.x, site.y, roomToSearch.name));
        }
    }
    return sites.length;
}






