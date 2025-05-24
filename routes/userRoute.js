const express = require('express');
const { uploadUserPhotoHandler } = require('../services/userService');
const {
    getUserValidator,
    createUserValidator,
    updateUserValidator,
    deleteUserValidator,
    changeUserPasswordValidator,
    updateLoggedUserValidator,

} = require("../utils/validators/userValidator");

const { 
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    uploadUserImage,
    resizeImage,
    changeUserPassword,
    getLoggedUserData,
    updateLoggedUserPassword,
    updateLoggedUserData,
    deleteLoggedUserData,
    } = require('../services/userService');

const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);
router.post(
  '/uploadPhoto',
  authService.allowedTo('user', 'admin', 'manager'), // allow all roles to upload profile photo
  uploadUserImage,
  resizeImage,
  uploadUserPhotoHandler // or a new service handler like saveUploadedPhoto if needed
);

router.post('/check-image-exists', authService.allowedTo('user', 'admin', 'manager'), require('../services/userService').checkImageExists);
router.get ("/getMe", getLoggedUserData, getUser);
router.put ("/changeMyPassword", updateLoggedUserPassword);
router.put(
  "/updateMe",
  updateLoggedUserValidator,
  uploadUserImage,    // multer middleware parses file and puts it in req.file
  resizeImage,        // sharp middleware processes image and sets req.body.profileImg
  updateLoggedUserData
);
router.put ("/deleteMe", deleteLoggedUserData);

// Admin
router.use(authService.allowedTo('admin', 'manager'));
router.put(
    '/changePassword/:id',
    changeUserPasswordValidator,
    changeUserPassword
);

router
.route('/')
.get(getUsers)
.post(
    uploadUserImage,
    resizeImage,
    createUserValidator,  
    createUser
);
router
.route('/:id')
.get(
    getUserValidator,
    getUser
    )
.put(
    uploadUserImage,
    resizeImage,
    updateUserValidator, 
    updateUser
)
.delete(
    deleteUserValidator,
    deleteUser);

module.exports = router;   