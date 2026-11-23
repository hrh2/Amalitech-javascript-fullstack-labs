// Routes only say WHICH middleware and controller handle WHICH url. No logic.
const express = require('express');
const mediaController = require('../controllers/mediaController');
const catchAsync = require('../utils/catchAsync');
const validate = require('../middlewares/validate');
const { uploadSingleFile } = require('../middlewares/upload');
const { createMediaBody, updateMediaBody, mediaIdParams, listMediaQuery } = require('../validators/mediaSchemas');

const router = express.Router();

router.post('/', uploadSingleFile, validate({ body: createMediaBody }), catchAsync(mediaController.create));
router.get('/', validate({ query: listMediaQuery }), catchAsync(mediaController.getAll));
router.get('/:id', validate({ params: mediaIdParams }), catchAsync(mediaController.getOne));
router.put('/:id', validate({ params: mediaIdParams, body: updateMediaBody }), catchAsync(mediaController.update));
router.delete('/:id', validate({ params: mediaIdParams }), catchAsync(mediaController.remove));

module.exports = router;
