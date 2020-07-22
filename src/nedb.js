const { DataBase } = require('wind-core-dao'),
    NeCollection = require('./ne_collection.js');

class NeDB extends DataBase {
    constructor(dbFilePath) {
        super();
        this.dbFilePath = dbFilePath;
        this.collections = {};
    }

    /**
     * @override
     */
    getCollections() {
        return Object.keys(this.db.getState());
    }

    /**
     * @override
     */
    getCollection(name) {
        if (!this.collections[name]) {
            this.collections[name] = new NeCollection(`${this.dbFilePath}.${name}.db`);
        }
        return this.collections[name];
    }
}

module.exports = NeDB;
