const express = require('express')
const router = express.Router()
const { verifyJWT } = require('../controllers/utils')

const AuthController = require('../controllers/authController')
const UserController = require('../controllers/userController')
const GameController = require('../controllers/gameController')

router.get('/generate-token/:_id', AuthController.generateToken);
router.post('/log-in', AuthController.logIn);
router.get('/log-out', verifyJWT, AuthController.logOut);
router.post('/verify-otp', AuthController.verifyOtp)
router.post('/resend-otp', AuthController.resendOtp)
router.post('/signup', AuthController.signup)
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', verifyJWT, AuthController.resetPassword);



router.get('/slide-list', UserController.slideList);
router.get('/how-to-play', UserController.HowToPlay);
router.get('/get-logo', UserController.getLogo);
router.post('/create-profile', verifyJWT, UserController.createProfile);
router.post('/edit-profile', verifyJWT, UserController.editProfile);
router.get('/getProfile', verifyJWT, UserController.getProfile);
router.post('/upload-kyc', verifyJWT, UserController.uploadKYC);

router.get('/about-us', UserController.AboutUs);
router.get('/privacy-policy', UserController.Privacy);
router.get('/faq', UserController.Faq);
router.get('/refund-policy', UserController.refundPolicy);
router.get('/terms-conditions', UserController.TermsAndCondition);

router.post('/test', UserController.Test);
router.post('/addWallet', verifyJWT, UserController.addBalance);
router.post('/addWallet-hook', verifyJWT, UserController.addBalanceHook);


router.post('/withdraw-balance', verifyJWT, UserController.withdrawBalance);
// router.post('/update-withdraw-balance', verifyJWT, UserController.updateWithdrawBalance);

router.get('/getWallet', verifyJWT, UserController.myWallet);
router.post('/addGame', verifyJWT, GameController.addGame);
router.get('/gameList', verifyJWT, GameController.gameList);

router.post('/addBank', verifyJWT, UserController.addBank);
router.get('/getBank', verifyJWT, UserController.getBank);

router.post('/add-notification', verifyJWT, UserController.saveNotification);
router.get('/get-notification', verifyJWT, UserController.getNotification);
router.post('/delete-notification', verifyJWT, UserController.deleteNotification);


router.get('/home-page', verifyJWT, GameController.HomePage);
router.get('/my-exam', verifyJWT, GameController.myExam);
router.get('/join-page', verifyJWT, GameController.JoinPage);
router.post('/join-game', verifyJWT, GameController.joinGame);
router.get('/winners-list', verifyJWT, GameController.winnersList);
router.post('/update-game', verifyJWT, GameController.updateGame);
router.get('/game-lang', verifyJWT, GameController.gameLang);
router.get('/get-question', verifyJWT, GameController.getQuestion);
router.get('/get-answer', verifyJWT, GameController.getAnswer);

// router.get('/pay-page',verifyJWT,GameController.PayPage);
router.post('/addQuiz', verifyJWT, GameController.addQuiz);

router.get('/quizList', verifyJWT, GameController.quizList);
router.get('/quiz-result', verifyJWT, GameController.quizResult);
router.post('/quiz-leadership', verifyJWT, GameController.quizLeadership);
router.get('/countQuestions/:gameId', verifyJWT, GameController.countQuestions);
router.get('/correct-percent', verifyJWT, GameController.correctPercentage);
router.get('/refer-link', verifyJWT, UserController.referLink);
router.get('/withdraw-history', verifyJWT, UserController.withdrawHistory);
router.get('/deposit-history', verifyJWT, UserController.depositHistory);
router.get('/quiz-history', verifyJWT, UserController.quizHistory);
router.get('/ref-history', verifyJWT, UserController.refHistory);
router.get('/social-links', verifyJWT, UserController.socialLinks);
router.get('/play-image-link', verifyJWT, UserController.playImageLink);

router.post('/add-slide', UserController.addSlide);




//--------------------------------------------------------ADMIN--------------------------------------------------------











module.exports = router
