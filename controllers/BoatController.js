const Errors = require("../common/Errors");

class BoatController {
  constructor(datastore, fromDatastore) {
    this.datastore = datastore;
    this.fromDatastore = fromDatastore;
    this.boatKey = "boat";
  }

  isValidBoat(boat) {
    return boat.name && boat.type && boat.length;
  }

  createBoat(name, type, length) {
    return {
      name: name,
      type: type,
      length: length,
    };
  }

  getBoatKeyFromId(id) {
    return this.datastore.key([this.boatKey, parseInt(id, 10)]);
  }

  async post_boat(newBoat) {
    var key = this.datastore.key(this.boatKey);
    const entity = { key: key, data: newBoat };
    try {
      await this.datastore.save(entity);
      return entity;
    } catch {
      return Errors.ERROR_FAILED_RESPONSE;
    }
  }

  async get_boat(id) {
    if (parseInt(id) === 0) return Errors.ERROR_BOAT_NOT_FOUND;
    const key = this.getBoatKeyFromId(id);
    const found = await this.datastore.get(key);
    if (found[0]) {
      return found.map(this.fromDatastore)[0];
    } else {
      return Errors.ERROR_BOAT_NOT_FOUND;
    }
  }

  async get_boats() {
    const q = this.datastore.createQuery(this.boatKey);
    return this.datastore.runQuery(q).then((entities) => {
      return entities[0].map(this.fromDatastore);
    });
  }

  async patch_boat(id, newBoat) {
    let boat = await this.get_boat(id);
    if (boat !== Errors.ERROR_BOAT_NOT_FOUND) {
      boat = {
        ...boat,
        name: newBoat.name,
        type: newBoat.type,
        length: parseInt(newBoat.length, 10),
      };
      await this.datastore.save({
        key: this.getBoatKeyFromId(id),
        data: this.createBoat(boat.name, boat.type, boat.length),
      });
      return boat;
    } else return boat;
  }

  delete_boat(id) {
    const key = this.getBoatKeyFromId(id);
    return this.datastore.delete(key);
  }
}

module.exports = BoatController;
