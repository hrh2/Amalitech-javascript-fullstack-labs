// HTTP in, HTTP out. Reads the (already validated) request, calls the service, sends the response.
// No business rules here and no database calls.
const { mediaService } = require('../services/mediaService');
const { sendSuccess } = require('../utils/responses');

const mediaController = {
  async create(req, res) {
    const media = await mediaService.create(req.file, req.validated.body);
    res.location(`/media/${media.id}`);
    sendSuccess(res, { media }, 201);
  },

  async getAll(req, res) {
    const data = await mediaService.list(req.validated.query);
    sendSuccess(res, data);
  },

  async getOne(req, res) {
    const media = await mediaService.getById(req.validated.params.id);
    sendSuccess(res, { media });
  },

  async update(req, res) {
    const media = await mediaService.update(req.validated.params.id, req.validated.body);
    sendSuccess(res, { media });
  },

  async remove(req, res) {
    const media = await mediaService.remove(req.validated.params.id);
    sendSuccess(res, { id: media.id });
  },
};

module.exports = mediaController;
