const express = require('express')
const router = express.Router()
const { verifyJWT } = require('../controllers/utils')

const AuthController = require('../controllers/admin/AuthController')
const UserController = require('../controllers/admin/UserController')

let multer = require("multer");
const GameController = require('../controllers/admin/GameController')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const suffix = file.mimetype.split('/');
    cb(null, `${file.fieldname}-${Date.now()}.${suffix[1]}`);
  },
});

const upload = multer({ storage });

router.post('/log-in', AuthController.logIn);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/update-password', AuthController.updatePassword);
router.get('/me', verifyJWT, AuthController.me)
router.post('/change-password', verifyJWT, AuthController.changeAdminPassword);
router.get('/log-out', verifyJWT, AuthController.logOut);


router.post('/admin-create', AuthController.adminCreate);



router.get('/get-profile', verifyJWT, UserController.getAdminProfile);
router.post('/edit-profile', verifyJWT, upload.single('profile-pic'), UserController.editAdminProfile)
router.get('/setting', verifyJWT, UserController.getSetting);
router.post('/setting', verifyJWT, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'ad1', maxCount: 1 }, { name: 'ad2', maxCount: 1 }, { name: 'ad3', maxCount: 1 }, { name: 'ad4', maxCount: 1 }, { name: 'playVideoLink', maxCount: 1 }, { name: 'playImageLink', maxCount: 1 }]), UserController.postSetting);

router.post('/addGame', verifyJWT, GameController.addGame);
router.post('/push-notification', verifyJWT, UserController.pushNotification);
router.post('/add-slide', verifyJWT, GameController.addSlide);
router.get('/slide-list', verifyJWT, GameController.slideList);
router.post('/add-social-link', verifyJWT, GameController.addSocialLink);
router.get('/social-link-list', verifyJWT, GameController.socialLinkList);


router.post('/update-withdraw-balance', verifyJWT, UserController.updateWithdrawBalance);
router.post('/add-penalty', verifyJWT, UserController.takePenalty);
router.post('/add-bonus', verifyJWT, UserController.addBonus);
router.get('/bonus-penalty-list', verifyJWT, UserController.bonusPenaltyList)
router.get('/user-list', verifyJWT, UserController.userList)
router.post('/change-user-status/:id', verifyJWT, UserController.changeUserStatus)
router.get('/deposit-list', verifyJWT, UserController.depositList)
router.post('/update-deposit-request', verifyJWT, UserController.changeDepositStatus)
router.get('/withdraw-list', verifyJWT, UserController.withdrawList)
router.post('/update-withdraw-request', verifyJWT, UserController.changeWithdrawStatus)
router.get('/faqs-list', verifyJWT, UserController.faqsList)
router.post('/add-Faq', verifyJWT, UserController.addFaqs)
router.post('/edit-Faq/:id', verifyJWT, UserController.editFaqs)
router.get('/dashboard-count', verifyJWT, UserController.dashboardCount)
router.get('/transaction-list/:id', verifyJWT, UserController.transactionListByParticularUser)
router.get('/quiz-list', verifyJWT, UserController.quizList)
router.get('/user-exam-list', verifyJWT, UserController.userQuizList)




// Csv api
router.get('/user-list-csv', verifyJWT, UserController.userListCsv)
router.get('/bonus-penalty-list-csv', verifyJWT, UserController.bonusPenaltyListCsv)
router.get('/quiz-list-csv', verifyJWT, UserController.quizListCsv)
router.get('/deposit-history-csv', verifyJWT, UserController.depositHistoryCsv)
router.get('/withdraw-history-csv', verifyJWT, UserController.withdrawHistoryCsv)
router.get('/user-transaction-history-csv/:id', verifyJWT, UserController.userTransactionHistoryCsv)


// router.get('/get-slider',UserController.getSlider);
// router.get('/get-address',verifyJWT,UserController.getAddress);
// router.post('/save-address',verifyJWT,UserController.saveAddress);
// router.post('/delete-address',verifyJWT,UserController.deleteAddress);
// router.post('/edit-profile',verifyJWT,UserController.editProfile);
// router.get('/about-us',UserController.AboutUs);
// router.get('/privacy-policy',UserController.Privacy);
// // router.get('/user-profile',verifyJWT,UserController.Profile);
// router.post('/test',UserController.Test);
// router.post('/addWallet',verifyJWT,UserController.Balance);
// router.get('/getWallet',verifyJWT,UserController.myWallet);
// router.post('/addGame',verifyJWT,GameController.addGame);
// router.get('/gameList',verifyJWT,GameController.gameList);
// router.post('/create-profile',verifyJWT,UserController.createProfile);
// router.post('/addBank',verifyJWT,UserController.addBank);
// router.get('/getBank',verifyJWT,UserController.getBank);
// router.get('/getProfile',verifyJWT,UserController.getProfile);

//--------------------------------------------------------ADMIN--------------------------------------------------------











module.exports = router
