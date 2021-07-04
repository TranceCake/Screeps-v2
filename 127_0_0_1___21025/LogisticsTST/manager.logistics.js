var logisticsManager = {
    run: function(room) {
        room.memory.supply = getRoomSupply(room);
    },

    getRoomSupply: function(room) {
        let containers = _.filter(room.find(FIND_STRUCTURES), s => s.structureType === STRUCTURE_CONTAINER);
        let dropped_resources = room.find(FIND_DROPPED_RESOURCES);
        let storage = room.find(STRUCTURE_STORAGE);
        let total = containers.concat(dropped_resources.concat(storage));

        total = _.map(total, this.makeSupply);
        room.memory.supply = _.flatten(total);
    },

    submitOrder: function(resource_type, amount, target, time_till_delivery) {
        target.room.memory.push(new Order(resource_type, amount, target, time_till_delivery))
    },

    getOrders: function(current_position, capacity) {

    },

    makeSupply: function(item) {
        if(item.store !== undefined) {
            let supply = [];

            _.forEach(item.store, function(value, key) {
                supply.push(new Supply(key, value, item, item.pos, Game.time, false));
            });

            return supply;
        } else {
            return [new Supply(item.resourceType, item.amount, item, item.pos, Game.time, true)];
        }
    }
};

module.exports = logisticsManager;

class Order {
    constructor(resource_type, amount, target, deliver_at_game_time, priority) {
        this.resource_type = resource_type;
        this.amount = amount;
        this.target = target;
        this.deliver_at_game_time = deliver_at_game_time;
        this.priority = priority;
    }
}

class Supply {
    constructor(resource_type, amount, target, position, submitted_at_game_time, decaying) {
        this.resource_type = resource_type;
        this.amount = amount;
        this.target = target;
        this.position = position;
        this.submitted_at_game_time = submitted_at_game_time;
        this.decaying = decaying;
    }
}