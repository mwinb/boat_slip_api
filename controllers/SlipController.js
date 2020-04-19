const Errors = require("../common/Errors");

class SlipController {
  constructor(datastore, fromDatastore) {
    this.datastore = datastore;
    this.fromDatastore = fromDatastore;
    this.slipKey = "slip";
  }

  slipAndBoatExist(slip, boat) {
    return (
      slip !== Errors.ERROR_SLIP_NOT_FOUND &&
      boat !== Errors.ERROR_BOAT_NOT_FOUND
    );
  }

  createSlip(number, currentBoat) {
    return {
      number: number,
      current_boat: currentBoat ? currentBoat : null,
    };
  }

  hasNumber(slip) {
    return slip.number !== undefined;
  }

  getSlipKeyFromId(id) {
    return this.datastore.key([this.slipKey, parseInt(id, 10) || 1]);
  }

  async get_slips() {
    const q = this.datastore.createQuery(this.slipKey);
    try {
      return this.datastore.runQuery(q).then((entities) => {
        return entities[0].map(this.fromDatastore);
      });
    } catch {
      return [];
    }
  }

  async get_slips_by_boat_id(boatId) {
    const q = this.datastore
      .createQuery(this.slipKey)
      .filter("current_boat", "=", boatId);
    return this.datastore.runQuery(q).then((entities) => {
      return entities[0].map(this.fromDatastore);
    });
  }

  async get_slip(id) {
    if (parseInt(id) === 0) return Errors.ERROR_SLIP_NOT_FOUND;
    const key = this.getSlipKeyFromId(id);
    const found = await this.datastore.get(key);
    if (found[0]) {
      return found.map(this.fromDatastore)[0];
    } else {
      return Errors.ERROR_SLIP_NOT_FOUND;
    }
  }

  async post_slip(newSlip) {
    var key = this.datastore.key(this.slipKey);
    const entity = { key: key, data: newSlip };
    try {
      await this.datastore.save(entity);
      return entity;
    } catch {
      return Errors.ERROR_FAILED_RESPONSE;
    }
  }

  async update_slip(id, boatId) {
    let slip = await this.get_slip(id);
    boatId ? (slip.current_boat = boatId) : (slip.current_boat = null);
    await this.datastore.save({
      key: this.getSlipKeyFromId(id),
      data: this.createSlip(slip.number, slip.current_boat),
    });
  }

  delete_slip(id) {
    const key = this.getSlipKeyFromId(id);
    return this.datastore.delete(key);
  }
}

module.exports = SlipController;
