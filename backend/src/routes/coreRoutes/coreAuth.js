const express = require('express');
console.log("reached coreAuth.js");
const router = express.Router();

const { catchErrors } = require('../../handlers/errorHandlers'); // relative path here
const adminAuth = require('../../controllers/coreControllers/adminAuth'); // relative path here

router.route('/login').post(catchErrors(adminAuth.login));

router.route('/forgetpassword').post(catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(catchErrors(adminAuth.resetPassword));
console.log("just below resetpassword route");
router.route('/register').post(catchErrors(adminAuth.register));
console.log("just below register route");
router.route('/logout').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.logout));

module.exports = router;
