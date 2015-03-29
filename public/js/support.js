var support = {

    getNewRoom: function(rooms){
        do {
            var room = Math.floor(Math.random() * 10000);
        } while (room in rooms);
        return room;
    }
}

module.exports = support;