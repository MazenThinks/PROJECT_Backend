const multer = require('multer');
const ApiError = require('../utils/apiError');
const path = require('path');
const fs = require('fs');

const multerOptions = () => {
  const uploadDir = path.join(__dirname, '../uploads/users');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = file.mimetype.split('/')[1];
      const filename = `user-${Date.now()}.${ext}`;
      cb(null, filename);
    },
  });

  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only Images allowed', 400), false);
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

  return upload;
};

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);
//1- DiskStorage engine
//const multerStorage = multer.diskStorage({
   // destination: function (req, file, cb) {
       // cb(null, 'uploads/categories');
   // },
   // filename: function (req, file, cb) {
      // const ext = file.mimetype.split('/')[1];
     //  const filename = `category-${uuidv4()}-${Date.now()}.${ext}`;
     //  cb(null, filename);
    //},
//});

exports.uploadMixOfImages = (arrayOfFields) =>
multerOptions().fields(arrayOfFields);