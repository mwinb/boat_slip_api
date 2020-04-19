const Errors = {
  ERROR_FAILED_RESPONSE: { id: 500, message: "Unable to Process Request" },
  ERROR_BOAT_NOT_FOUND: { Error: "No boat with this boat_id exists" },
  ERROR_MISSING_ATTRIBUTES: {
    Error:
      "The request object is missing at least one of the required attributes",
  },
  ERROR_BAD_SLIP_CREATE: {
    Error: "The request object is missing the required number",
  },
  ERROR_SLIP_NOT_FOUND: {
    Error: "No slip with this slip_id exists",
  },
  ERROR_SLIP_OR_BOAT_NOT_FOUND: {
    Error: "The specified boat and/or slip don’t exist",
  },
  ERROR_SLIP_NOT_EMPTY: {
    Error: "The slip is not empty",
  },
  ERROR_NO_SLIP_OR_BOAT_TO_DEPART: {
    Error: "No boat with this boat_id is at the slip with this slip_id",
  },
};

module.exports = Errors;
