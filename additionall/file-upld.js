const multer = require('multer');

const fileAvatar = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, '/home/alobunets/usof_backend/alobunets/assetss/profpic/');
    },
    filename: (_req, file, cb) => {
        cb(null, `${file.originalname}`);
    },
});

const loaderAvatar = multer({ storage: fileAvatar });

module.exports = loaderAvatar;