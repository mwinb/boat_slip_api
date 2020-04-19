const express = require("express");
const BoatController = require("./controllers/BoatController");
const SlipController = require("./controllers/SlipController");
const Errors = require("./common/Errors");
const { Datastore } = require("@google-cloud/datastore");

const bodyParser = require("body-parser");

function fromDataStore(item) {
  item.id = item[Datastore.KEY].id;
  return item;
}

function getUrl(req) {
  return req.protocol + "://" + req.get("host") + req.originalUrl;
}

const app = express();
const datastore = new Datastore();
const boatController = new BoatController(datastore, fromDataStore);
const slipController = new SlipController(datastore, fromDataStore);

const router = express.Router();

app.use(bodyParser.json());

/* Boats */

router.get("/boats", async (req, res) => {
  try {
    const boats = await boatController.get_boats();
    res.status(200).json(
      boats.map((boat) => {
        return { ...boat, self: `${getUrl(req)}/${boat.id}` };
      })
    );
  } catch (error) {
    res.status(200).json([]);
  }
});

router.get("/boats/:id", async (req, res) => {
  const boat = await boatController.get_boat(req.params.id);
  if (boat !== Errors.ERROR_BOAT_NOT_FOUND)
    res.status(200).json({ ...boat, self: getUrl(req) });
  else res.status(404).json(boat);
});

router.post("/boats", async (req, res) => {
  const boat = boatController.createBoat(
    req.body.name,
    req.body.type,
    req.body.length
  );
  if (!boatController.isValidBoat(boat))
    return res.status(400).json(Errors.ERROR_MISSING_ATTRIBUTES);
  else {
    const entity = await boatController.post_boat(boat);
    if (entity !== Errors.ERROR_FAILED_RESPONSE)
      res.status(201).json({
        id: entity.key.id,
        ...entity.data,
        self: `${getUrl(req)}/${entity.key.id}`,
      });
    else res.status(500).json(entity);
  }
});

router.patch("/boats/:id", async (req, res) => {
  let boat = boatController.createBoat(
    req.body.name,
    req.body.type,
    req.body.length
  );
  if (!boatController.isValidBoat(boat))
    return res.status(400).json(Errors.ERROR_MISSING_ATTRIBUTES);
  boat = await boatController.patch_boat(req.params.id, boat);
  if (boat !== Errors.ERROR_BOAT_NOT_FOUND)
    res.status(200).json({ ...boat, self: getUrl(req) });
  else res.status(404).json(boat);
});

router.delete("/boats/:id", async (req, res) => {
  const boat = await boatController.get_boat(req.params.id);
  if (boat === Errors.ERROR_BOAT_NOT_FOUND) return res.status(404).json(boat);
  const slips = await slipController.get_slips_by_boat_id(req.params.id);
  if (slips[0]) {
    await slipController.update_slip(slips[0].id);
  }
  await boatController.delete_boat(boat.id);
  res.status(204).json();
});

/* SLIPS */

router.post("/slips", async (req, res) => {
  let slip = slipController.createSlip(req.body.number);
  if (!slipController.hasNumber(slip))
    return res.status(400).json(Errors.ERROR_BAD_SLIP_CREATE);
  slip = await slipController.post_slip(slip);
  if (slip !== Errors.ERROR_FAILED_RESPONSE) {
    return res.status(201).json({
      ...slip.data,
      id: slip.key.id,
      self: `${getUrl(req)}/${slip.key.id}`,
    });
  } else return res.status(500).json(slip);
});

router.get("/slips/:id", async (req, res) => {
  const slip = await slipController.get_slip(req.params.id);
  if (slip !== Errors.ERROR_SLIP_NOT_FOUND)
    res.status(200).json({ ...slip, self: getUrl(req) });
  else res.status(404).json(slip);
});

router.get("/slips", async (req, res) => {
  try {
    const slips = await slipController.get_slips();
    res.status(200).json(
      slips.map((slip) => {
        return { ...slip, self: `${getUrl(req)}/${slip.id}` };
      })
    );
  } catch {
    res.status(200).json([]);
  }
});

router.put("/slips/:slipId/:boatId", async (req, res) => {
  const slip = await slipController.get_slip(req.params.slipId);
  const boat = await boatController.get_boat(req.params.boatId);
  if (!slipController.slipAndBoatExist(slip, boat)) {
    return res.status(404).json(Errors.ERROR_SLIP_OR_BOAT_NOT_FOUND);
  }

  if (slip.current_boat !== null) {
    return res.status(403).json(Errors.ERROR_SLIP_NOT_EMPTY);
  }

  const slips = await slipController.get_slips_by_boat_id(boat.id);
  if (slips.length > 0) {
    return res.status(403).json({ Error: `Already In Slip: ${slips[0].id}` });
  }
  await slipController.update_slip(slip.id, boat.id);
  return res.status(204).json({});
});

router.delete("/slips/:slipId/:boatId", async (req, res) => {
  const slip = await slipController.get_slip(req.params.slipId);
  const boat = await boatController.get_boat(req.params.boatId);
  if (
    !slipController.slipAndBoatExist(slip, boat) ||
    slip.current_boat === null ||
    slip.current_boat !== boat.id
  ) {
    return res.status(404).json(Errors.ERROR_NO_SLIP_OR_BOAT_TO_DEPART);
  }
  await slipController.update_slip(slip.id);
  return res.status(204).json();
});

router.delete("/slips/:slipId", async (req, res) => {
  const slip = await slipController.get_slip(req.params.slipId);
  if (slip === Errors.ERROR_SLIP_NOT_FOUND) {
    return res.status(404).json(Errors.ERROR_SLIP_NOT_FOUND);
  }
  await slipController.delete_slip(slip.id);
  res.status(204).json();
});

app.use("/", router);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
