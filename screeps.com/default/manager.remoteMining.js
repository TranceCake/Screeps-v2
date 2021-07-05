var remoteMiningManager = {
    run: function(number) {
        
        var peaceKeepers = _.filter(Game.creeps, c => c.memory.role === 'peaceKeeper' && c.memory.remote === number);
        var numPeaceKeepers = 2;
        if(!peaceKeepers[0] || peaceKeepers.length < numPeaceKeepers || _.min(peaceKeepers, p => p.ticksToLive) < 300 && peaceKeepers.length === numPeaceKeepers) {
            // add peaceKeeper to spawn queue
            return 'keeper';
        }
        
        var flag = Game.flags['Remote-' + number];
        var invaders = [];
        if(!!flag.room)
            invaders = _.filter(flag.room.find(FIND_HOSTILE_CREEPS), c => c.owner.username === 'Invader');
        
        var miners = _.filter(Game.creeps, c => c.memory.role === 'remoteMiner' && c.memory.remote === number);
        if(miners.length < 3 && invaders.length === 0) {
            // add remoteMiner to spawn queue
            return 'miner';
        }
        
        var collectors = _.filter(Game.creeps, c => c.memory.role === 'remoteCollector' && c.memory.remote === number);
        if(number === 1 && collectors.length < 6 && invaders.length === 0) {
            // add remoteCollector to spawn queue
            return 'collector';
        } else if(number === 2 && collectors.length < 8 && invaders.length === 0) {
            // add remoteCollector to spawn queue
            return 'collector';
        } else if(number === 3 && collectors.length < 7 && invaders.length === 0) {
            // add remoteCollector to spawn queue
            return 'collector';
        }
        
        return 'nothing';
    }
};

module.exports = remoteMiningManager;