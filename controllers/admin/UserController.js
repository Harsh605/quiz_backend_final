const jwt = require('jsonwebtoken')
const { signJWT, verifyJWT } = require('../utils')
const { generateOtp, randomString, utcDateTime } = require('../../lib/util')
const mongoose = require('mongoose')
const Admin = require('../../db/models/admin.model')
const Setting = require('../../db/models/setting.model')
var request = require('request');
const bcrypt = require('bcryptjs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { User, Transaction, Wallet, Notification, Faqs, Game, UserGame } = require('../../db/models/User.model')

class UserController {

    async getAdminProfile(req, res, next) {

        try {
            const user = await Admin.findOne({
                _id: req.user._id,
                status: true
            }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean()
            if (!user) {
                return res.status(404).json({ msg: 'Not found' });
            }

            if (!user.status) {
                return res.status(404).json({ msg: 'Not verified' });
            }

            user.avatar = process.env.BASE_URL + user.avatar;

            return res.success({ admin: user }, 'Get Details');
        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    async editAdminProfile(req, res, next) {
        try {
            const { name, email, mobile } = req.body;
            const payload = {}
            const userDetail = await Admin.findOne({ _id: req.user._id });

            if (name) payload.name = name;
            if (email) payload.email = email;
            if (mobile) payload.mobile = mobile;
            if (req.file)
                payload.avatar = req.file.filename

            if (!userDetail)
                return res.error({}, "User not found.")

            await Admin.updateOne({ _id: req.user._id }, { $set: payload })

            return res.success({}, "Profile Update Successfully.")
        } catch (err) {
            return next(err);
        }
    }

    async getSetting(req, res, next) {
        try {
            const setting = await Setting.findOne({}).lean()

            return res.success({ setting: setting }, "Get setting.")
        } catch (err) {
            return next(err);
        }
    }

    async postSetting(req, res, next) {
        try {
            const { whatsappLink, telegramLink, youtubeLink, email, playText, aboutUs, termsAndCondition, privacyPolicy, refundCancellation, quizTiming,
                questionTiming, nextQuestionTiming, rightQuestionMarks, wrongQuestionMarks, quizInstruction, referralPoints, minimumWithdraw, withdrawCommission, playStoreLink }
                = req.body;
            const payload = {}
            const settingDetail = await Setting.findOne({});

            if (whatsappLink) payload.whatsappLink = whatsappLink;
            if (telegramLink) payload.telegramLink = telegramLink;
            if (youtubeLink) payload.youtubeLink = youtubeLink;
            if (playStoreLink) payload.playStoreLink = playStoreLink;
            if (email) payload.email = email;
            if (playText) payload.playText = playText;
            if (aboutUs) payload.aboutUs = aboutUs;
            if (privacyPolicy) payload.privacyPolicy = privacyPolicy;
            if (termsAndCondition) payload.termsAndCondition = termsAndCondition;
            if (refundCancellation) payload.refundCancellation = refundCancellation;
            if (quizTiming) payload.quizTiming = quizTiming;
            if (questionTiming) payload.questionTiming = questionTiming;
            if (nextQuestionTiming) payload.nextQuestionTiming = nextQuestionTiming;
            if (rightQuestionMarks) payload.rightQuestionMarks = rightQuestionMarks;
            if (wrongQuestionMarks) payload.wrongQuestionMarks = wrongQuestionMarks;
            if (referralPoints) payload.referralPoints = referralPoints;
            if (minimumWithdraw) payload.minimumWithdraw = minimumWithdraw;
            if (quizInstruction) payload.quizInstruction = quizInstruction;
            if (withdrawCommission) payload.withdrawCommission = withdrawCommission;

            if (req?.files?.logo && req?.files?.logo[0])
                payload.logo = req.files.logo[0].filename
            if (req?.files?.ad1 && req?.files?.ad1[0])
                payload.ad1 = req.files.ad1[0].filename
            if (req?.files?.ad2 && req?.files?.ad2[0])
                payload.ad2 = req?.files?.ad2[0].filename
            if (req?.files?.ad3 && req?.files?.ad3[0])
                payload.ad3 = req?.files?.ad3[0].filename
            if (req?.files?.ad4 && req?.files?.ad4[0])
                payload.ad4 = req?.files?.ad4[0].filename
            if (req?.files?.playVideoLink && req?.files?.playVideoLink[0])
                payload.playVideoLink = req?.files?.playVideoLink[0].filename
            if (req?.files?.playImageLink && req?.files?.playImageLink[0])
                payload.playImageLink = req?.files?.playImageLink[0].filename

            if (!settingDetail)
                await Setting.create(payload)
            else
                await Setting.findOneAndUpdate({ _id: settingDetail._id }, { $set: payload })

            return res.success({}, "Setting update successfully.")
        } catch (err) {
            return next(err);
        }
    }

    async pushNotification(req, res, next) {
        try {
            const { title, description } = req.body;
            let users=await User.find();
            let notifications=[];
            
            for (let user of users) {
                let obj = {
                    title,
                    body: description,
                    userId: user._id,
                    isAdmin: true
                }
                notifications.push(obj);
            }

            await Notification(notifications);
            return res.success({}, "Notification pushed!")
        } catch (err) {
            return next(err);
        }
    }


    async updateWithdrawBalance(req, res, next) {
        try {
            let { _id, status } = req.body;


            const _txn = await Transaction.findOne({ _id });
            const wallet = await Wallet.find({ userId: req._id });

            if (_txn?.type == 4 && status == 1) {
                
                _txn.type = 3;
                _txn.status = status;
                await _txn.save();
                wallet.holdBalance -= holdBalance;
                await wallet.save();
                return res.success({}, 'Withdraw precced successfully.');

            } else if (_txn?.type == 4 && status == 0) {

                _txn.type = 3;
                _txn.status = status;
                await _txn.save();
                wallet.balance += balance;
                wallet.winBalance += balance;
                wallet.holdBalance -= holdBalance;
                await wallet.save();

                return res.success({}, 'Withdraw precced successfully.');
            } else {
                return res.warn({}, 'Something went wrong!');
            }


        } catch (err) {
            console.error(err);
            return next(err);

        }
    }


    async takePenalty(req, res, next) {
        try {
            const { amount, userId } = req.body;

            let _txn = new Transaction({
                userId,
                amount,
                msg: 'Penalty',
                type: 4,
                status: 1
            });
            const txn = await _txn.save();

            const _wallet = await Wallet.findOne({ userId });
            _wallet.balance -= amount;
            if (_wallet.winBalance > amount) {
                _wallet.winBalance -= amount;
            } else if (_wallet.deposit > amount) {
                _wallet.deposit -= amount;
            }
            const wallet = await _wallet.save();

            return res.success({ wallet }, "Penalty add successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async addBonus(req, res, next) {
        try {
            const { amount, userId } = req.body;

            let _txn = new Transaction({
                userId,
                amount,
                msg: 'Bonus',
                type: 7,
                status: 1
            });
            const txn = await _txn.save();
            await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: +amount, discount_bonus: +amount } })

            return res.success({}, "Bonus add successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async bonusPenaltyList(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')
            const keyword = req.query.keyword
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10;
            const condition = {}
            if (keyword) condition.$or = [
                { name: { $regex: keyword.trim(), $options: 'i' } },
                { id: { $regex: keyword.trim(), $options: 'i' } },
                { mobile: { $regex: keyword.trim(), $options: 'i' } }
            ]
            const allUser = await User.aggregate([
                {
                    $match: condition
                },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'wallet'
                    }
                },
                {
                    $unwind: {
                        path: '$wallet',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        deposit: { $ifNull: ['$wallet.deposit', 0] },
                        balance: { $ifNull: ['$wallet.balance', 0] }
                    }
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        mobile: 1,
                        id: 1,
                        deposit: 1,
                        balance: 1,
                        createdAt: 1,
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: +PAGE_SIZE * +page
                },
                {
                    $limit: +PAGE_SIZE
                }
            ])
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ').skip(PAGE_SIZE * page)
            const total = await User.countDocuments({ ...condition })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allUser }, "Bonus penalty list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async userList(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')
            const status = req.query.status
            const keyword = req.query.keyword
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const condition = {}
            if (status) condition.status = JSON.parse(status)
            if (keyword) condition.$or = [
                { name: { $regex: keyword.trim(), $options: 'i' } },
                { email: { $regex: keyword.trim(), $options: 'i' } },
                { id: { $regex: keyword.trim(), $options: 'i' } },
                { mobile: { $regex: keyword.trim(), $options: 'i' } }
            ]
            const allUser = await User.aggregate([
                {
                    $match: condition
                },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'wallet'
                    }
                },
                {
                    $unwind: {
                        path: '$wallet',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        winBalance: { $ifNull: ['$wallet.winBalance', 0] },
                        ref_amount: { $ifNull: ['$wallet.ref_amount', 0] },
                        withdraw: { $ifNull: ['$wallet.withdraw', 0] },
                        balance: { $ifNull: ['$wallet.balance', 0] },
                        statusUser: { $cond: [{ $eq: ['$status', true] }, 'Active', 'Block'] },
                        totalWiningAmount: {
                            $cond: [{ $and: [{ $ne: ['$wallet.winBalance', null] }, { $ne: ['$wallet.withdraw', null] }] }, { $subtract: ['$wallet.winBalance', '$wallet.withdraw'] }, 0]
                        }
                    }
                },
                {
                    $project: {
                        password: 0,
                        wallet: 0
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: +PAGE_SIZE * +page
                },
                {
                    $limit: +PAGE_SIZE
                }
            ])
            const total = await User.countDocuments({ ...condition })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allUser }, "User list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async changeUserStatus(req, res, next) {
        try {
            let { status } = req.body;
            let _id = req.params.id;
            const user = await User.findOne({ _id })
            if (!user) return res.error({}, "User not found.")
            await User.updateOne({ _id }, { $set: { status: status } })
            return res.success({}, "User status update successfully.")
        } catch (err) {
            return next(err);
        }
    }

    async depositList(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')
            const keyword = req.query.keyword
            const status = req.query.status
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const condition = {}, condition2 = {}
            if (status) condition2.status = +status
            if (keyword) condition.$or = [
                { 'userId.name': { $regex: keyword.trim(), $options: 'i' } },
                { 'userId.id': { $regex: keyword.trim(), $options: 'i' } }
            ]
            const allDepositList = await Transaction.aggregate([
                {
                    $match: { type: 0, ...condition2 }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [{
                            $project: {
                                name: 1,
                                id: 1
                            }
                        }],
                        as: 'userId'
                    }
                },
                {
                    $unwind: {
                        path: '$userId',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: condition
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: +PAGE_SIZE * +page
                },
                {
                    $limit: +PAGE_SIZE
                }
            ])
            // const allDepositList = await Transaction.find({ type: 0 }).populate('userId', 'name id').sort({ createdAt: -1 }).skip(+PAGE_SIZE * +page).limit(+PAGE_SIZE)
            const total = await Transaction.countDocuments({ type: 0, ...condition2 })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allDepositList }, "User list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async changeDepositStatus(req, res, next) {
        try {
            const { type, itemId } = req.body;
            const transactionExist = await Transaction.findOne({ _id: itemId, type: 0 })
            if (!transactionExist) return res.error({}, "Transaction not found.")
            await Transaction.updateOne({ _id: itemId }, { $set: { type: 0, status: type === 'accept' ? 1 : 2 } })
            return res.success({}, "Transaction status update successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async withdrawList(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')

            const keyword = req.query.keyword
            const status = req.query.status
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const condition = {}, condition2 = {}
            if (status) condition2.status = +status
            if (keyword) condition.$or = [
                { 'userId.name': { $regex: keyword.trim(), $options: 'i' } },
                { 'userId.id': { $regex: keyword.trim(), $options: 'i' } }
            ]
            const allWithdraw = await Transaction.aggregate([
                {
                    $match: { type: 3, ...condition2 }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [{
                            $project: {
                                name: 1,
                                id: 1
                            }
                        }],
                        as: 'userId'
                    }
                },
                {
                    $unwind: {
                        path: '$userId',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: condition
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: +PAGE_SIZE * +page
                },
                {
                    $limit: +PAGE_SIZE
                }
            ])
            const total = await Transaction.countDocuments({ type: 3, ...condition2 })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allWithdraw }, "User list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async changeWithdrawStatus(req, res, next) {
        try {
            const { type, itemId } = req.body;
            const transactionExist = await Transaction.findOne({ _id: itemId, type: 3 })
            if (!transactionExist) return res.error({}, "Transaction not found.")
            await Transaction.updateOne({ _id: itemId }, { $set: { type: 3, status: type === 'accept' ? 1 : 2 } })
            return res.success({}, "Transaction status update successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async faqsList(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')

            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const allFaqs = await Faqs.find({}).sort({ createdAt: -1 }).skip(PAGE_SIZE * page)
            const total = await Faqs.countDocuments({})
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allFaqs }, "User list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async addFaqs(req, res, next) {
        try {
            const { question, answer } = req.body;

            await Faqs.create({ question, answer })
            return res.success({}, "Faqs add successfully.")
        } catch (err) {
            return next(err);
        }
    }

    async editFaqs(req, res, next) {
        try {
            const { question, answer } = req.body;
            const faqsExist = await Faqs.findOne({ _id: req.params.id })
            if (!faqsExist) return res.error({}, "Faqs not found.")
            await Faqs.updateOne({ _id: req.params.id }, { $set: { question, answer } })
            return res.success({}, "Faqs update successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async dashboardCount(req, res, next) {
        try {
            const allUser = await User.countDocuments({})
            const allUserActive = await User.countDocuments({ status: true })
            const allUserInactive = await User.countDocuments({ status: false })
            let dashboardCount = {
                allUserCount: allUser,
                allUserActiveCount: allUserActive,
                allUserInactiveCount: allUserInactive,
                AllQuizCount: 0,
                AllQuizCompletedCount: 0,
                AllQuizRunningCount: 0,
                AllQuizUpComingCount: 0,
                AllRewardCount: 0,
                AllRewardTodayCount: 0,
                AllRewardRangeCount: 0,
                AllDepositCount: 0,
                AllDepositTodayCount: 0,
                AllWithdrawCount: 0,
                AllWithdrawTodayCount: 0,
                AllEarningCount: 0,
                AllEarningTodayCount: 0,
                AllRefferalCount: 0,
                AllRefferalTodayCount: 0,
            }
            return res.success(dashboardCount, "Dashboard count successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async transactionListByParticularUser(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')
            const id = req.params.id
            const transactionStatus = req.query.transactionStatus
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const condition = {}
            if (transactionStatus) condition.type = +transactionStatus
            const allTransaction = await Transaction.find({ userId: id, ...condition }).sort({ createdAt: -1 }).skip(+PAGE_SIZE * +page).limit(+PAGE_SIZE)
            const total = await Transaction.countDocuments({ userId: id, ...condition })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allTransaction }, "User list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async quizList(req, res, next) {
        try {
            console.log("------------------------------quizList------->")
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')
            const id = req.params.id
            const keyword = req.query.keyword
            const status = req.query.status
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const condition = {}
            if (keyword) condition.$or = [
                { gameNameInEnglish: { $regex: keyword.trim(), $options: 'i' } },
                // { email: { $regex: keyword.trim(), $options: 'i' } },
                // { mobile: { $regex: keyword.trim(), $options: 'i' } }
            ]
            if(status) condition.status = +status
            const allGames = await Game.aggregate([
                {
                    $match: condition
                },
                {
                    $lookup: {
                        from: 'usergames',
                        localField: '_id',
                        foreignField: 'gameId',
                        as: 'userGames'
                    }
                },
                {
                    $addFields: {
                        joinedUser: { $size: '$userGames'}
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: +PAGE_SIZE * +page
                },
                {
                    $limit: +PAGE_SIZE
                }
            ])
            // const allGames = await Game.find({ ...condition }).sort({ createdAt: -1 }).skip(+PAGE_SIZE * +page).limit(+PAGE_SIZE)
            const total = await Game.countDocuments({ ...condition })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allGames }, "Quiz list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }

    async userQuizList(req, res, next) {
        try {
            // const allUser = await Wallet.find({}, { balance: 1, deposit: 1 }).populate('userId', 'name email mobile id ')
            const userId = req.query.userId
            const gameId = req.query.gameId
            const keyword = req.query.keyword
            let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
            const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
            const condition = {}
            if(userId) condition.userId = new mongoose.Types.ObjectId(userId)
            if(gameId) condition.gameId = new mongoose.Types.ObjectId(gameId)
            if (keyword) condition.$or = [
                { gameNameInEnglish: { $regex: keyword.trim(), $options: 'i' } },
                // { email: { $regex: keyword.trim(), $options: 'i' } },
                // { mobile: { $regex: keyword.trim(), $options: 'i' } }
            ]
            // if(status) condition.status = +status
            const allGames = await UserGame.aggregate([
                {
                    $match: condition
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    email: 1,
                                    id: 1,
                                }
                            }
                        ],
                        as: 'userDetail'
                    }   
                },
                {
                    $unwind: {
                        path: '$userDetail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'pools',
                        localField: 'gameId',
                        foreignField: 'gameId',
                        as: 'PoolDetail'
                    }   
                },
                {
                    $unwind: {
                        path: '$PoolDetail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: +PAGE_SIZE * +page
                },
                {
                    $limit: +PAGE_SIZE
                }
            ])
            // const allGames = await UserGame.find({ ...condition }).sort({ createdAt: -1 }).skip(+PAGE_SIZE * +page).limit(+PAGE_SIZE)
            const total = await UserGame.countDocuments({ ...condition })
            return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allGames }, "Quiz list fetch successfully!")
        } catch (err) {
            return next(err);
        }
    }








    // CSV
    async userListCsv(req, res, next) {
        try {
            const allUser = await User.aggregate([
                {
                    $lookup: {
                        from: 'wallets',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'wallet'
                    }
                },
                {
                    $unwind: {
                        path: '$wallet',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        winBalance: { $ifNull: ['$wallet.winBalance', 0] },
                        ref_amount: { $ifNull: ['$wallet.ref_amount', 0] },
                        withdraw: { $ifNull: ['$wallet.withdraw', 0] },
                        balance: { $ifNull: ['$wallet.balance', 0] },
                        statusUser: { $cond: [{ $eq: ['$status', true] }, 'Active', 'Block'] },
                        totalWiningAmount: {
                            $cond: [{ $and: [{ $ne: ['$wallet.winBalance', null] }, { $ne: ['$wallet.withdraw', null] }] }, { $subtract: ['$wallet.winBalance', '$wallet.withdraw'] }, 0]
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $project: {
                        password: 0,
                        wallet: 0
                    }
                }
            ])
            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../../pdf/user_list.csv'),
                header: [
                    { id: 'name', title: 'User Name' },
                    { id: 'id', title: 'Registration ID' },
                    { id: 'mobile', title: 'Mobile No.' },
                    { id: 'email', title: 'Email Id' },
                    { id: 'city', title: 'City' },
                    { id: 'state', title: 'State' },
                    { id: 'country', title: 'Country' },
                    { id: 'amount', title: 'Total No. of Quiz' },
                    { id: 'winBalance', title: 'Winning Amount' },
                    { id: 'ref_amount', title: 'Referral Amount' },
                    { id: 'totalWiningAmount', title: 'Total Winning Wallet Amount' },
                    { id: 'balance', title: 'Wallet Balance' },
                    { id: 'refferal', title: 'No. of Refferal' },
                    { id: 'statusUser', title: 'Status' },
                    { id: 'createdAt', title: 'Date' }
                ],
            });

            csvWriter.writeRecords(allUser)
                .then(() => {
                    const url = process.env.API_URL + '/user_list.csv'
                    return res.success({ url }, 'CSV Download file successfully.')
                })
                .catch((error) => {
                    console.error('Error writing CSV:', error);
                    // res.status(500).send('Error generating the CSV file');
                });

        } catch (err) {
            return next(err);
        }
    }

    async bonusPenaltyListCsv(req, res, next) {
        try {
            const allUser = await User.aggregate([
                {
                    $lookup: {
                        from: 'wallets',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'wallet'
                    }
                },
                {
                    $unwind: {
                        path: '$wallet',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        deposit: { $ifNull: ['$wallet.deposit', 0] },
                        balance: { $ifNull: ['$wallet.balance', 0] }
                    }
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        mobile: 1,
                        id: 1,
                        deposit: 1,
                        balance: 1,
                        createdAt: 1,
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ])
            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../../pdf/bonus_penalty_list.csv'),
                header: [
                    { id: 'name', title: 'User Name' },
                    { id: 'id', title: 'User ID' },
                    { id: 'mobile', title: 'Mobile No.' },
                    { id: 'balance', title: 'Balance' }
                ],
            });

            csvWriter.writeRecords(allUser)
                .then(() => {
                    const url = process.env.API_URL + '/bonus_penalty_list.csv'
                    return res.success({ url }, 'CSV Download file successfully.')
                })
                .catch((error) => {
                    console.error('Error writing CSV:', error);
                    // res.status(500).send('Error generating the CSV file');
                });

        } catch (err) {
            return next(err);
        }
    }

    async quizListCsv(req, res, next) {
        try {
            const allGames = await Game.find({}).sort({ createdAt: -1 })
            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../../pdf/quiz_list.csv'),
                header: [
                    { id: 'gameNameInEnglish', title: 'Quiz Name' },
                    { id: 'pricePool', title: 'Quiz Amount' },
                    { id: 'mobile', title: 'Quiz Amount after discount' },
                    { id: 'noOfParticipation', title: 'Maximum Participation' },
                    { id: 'email', title: 'Joined Participation(If completed or live)' },
                    { id: 'noOfQuestion', title: 'No of question' },
                    { id: 'duration', title: 'Duration' },
                    { id: 'pricePool', title: 'Prize Pool' },
                    { id: 'commission', title: 'Commission of Admin' },
                    // { id: 'balance', title: 'Status' },
                    { id: 'createdAt', title: 'Date&Time' }
                ],
            });

            csvWriter.writeRecords(allGames)
                .then(() => {
                    const url = process.env.API_URL + '/quiz_list.csv'
                    return res.success({ url }, 'CSV Download file successfully.')
                })
                .catch((error) => {
                    console.error('Error writing CSV:', error);
                    // res.status(500).send('Error generating the CSV file');
                });

        } catch (err) {
            return next(err);
        }
    }

    async depositHistoryCsv(req, res, next) {
        try {
            const allDepositList = await Transaction.aggregate([
                {
                    $match: { type: 0 }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetail'
                    }
                },
                {
                    $unwind: {
                        path: '$userDetail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        userName: { $ifNull: ['$userDetail.name', ''] },
                        userIdd: { $ifNull: ['$userDetail.id', ''] },
                        userStatus: { $cond: [{ $eq: ['$status', 0] }, 'Pending', { $cond: [{ $eq: ['$status', 1] }, 'Paid', 'Reject'] }] }
                    }
                },
                {
                    $project: {
                        userDetail: 0
                    }
                }
            ])

            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../../pdf/deposit_history.csv'),
                header: [
                    { id: 'userName', title: 'User Name' },
                    { id: 'userIdd', title: 'User Id' },
                    { id: 'createdAt', title: 'Date&Time' },
                    { id: 'amount', title: 'Amount' },
                    { id: '_id', title: 'Transaction Id' },
                    { id: 'userStatus', title: 'Status' }
                ],
            });

            csvWriter.writeRecords(allDepositList)
                .then(() => {
                    const url = process.env.API_URL + '/deposit_history.csv'
                    return res.success({ url }, 'CSV Download file successfully.')
                })
                .catch((error) => {
                    console.error('Error writing CSV:', error);
                    // res.status(500).send('Error generating the CSV file');
                });

        } catch (err) {
            return next(err);
        }
    }

    async withdrawHistoryCsv(req, res, next) {
        try {
            const allWithdrawList = await Transaction.aggregate([
                {
                    $match: { type: 3 }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetail'
                    }
                },
                {
                    $unwind: {
                        path: '$userDetail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        userName: { $ifNull: ['$userDetail.name', ''] },
                        userIdd: { $ifNull: ['$userDetail.id', ''] },
                        userStatus: { $cond: [{ $eq: ['$status', 0] }, 'Pending', { $cond: [{ $eq: ['$status', 1] }, 'Paid', 'Reject'] }] }
                    }
                },
                {
                    $project: {
                        userDetail: 0
                    }
                }
            ])

            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../../pdf/withdraw_history.csv'),
                header: [
                    { id: 'userName', title: 'User Name' },
                    { id: 'userIdd', title: 'User Id' },
                    { id: 'createdAt', title: 'Date&Time' },
                    { id: 'amount', title: 'Amount' },
                    { id: '_id', title: 'Transaction Id' },
                    { id: 'userStatus', title: 'Status' }
                ],
            });

            csvWriter.writeRecords(allWithdrawList)
                .then(() => {
                    const url = process.env.API_URL + '/withdraw_history.csv'
                    return res.success({ url }, 'CSV Download file successfully.')
                })
                .catch((error) => {
                    console.error('Error writing CSV:', error);
                    // res.status(500).send('Error generating the CSV file');
                });

        } catch (err) {
            return next(err);
        }
    }

    async userTransactionHistoryCsv(req, res, next) {
        try {
            const id = req.params.id
            let allUserTransactionList = await Transaction.aggregate([
                {
                    $match: { userId: new mongoose.Types.ObjectId(id) }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetail'
                    }
                },
                {
                    $unwind: {
                        path: '$userDetail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        userName: { $ifNull: ['$userDetail.name', ''] },
                        userIdd: { $ifNull: ['$userDetail.id', ''] },
                        userStatus: { $cond: [{ $eq: ['$status', 0] }, 'Pending', { $cond: [{ $eq: ['$status', 1] }, 'Paid', 'Reject'] }] }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $project: {
                        userDetail: 0
                    }
                }
            ])

            const checkType = (type, status) => {
                //-1=pending deposit , 0=deposit,1=game ded,2=game won,3=withd,4=pen,5=refund,6=ref,7=bonus
                if (type === 0 && status === 0) {
                    return 'Deposit Request(Pending)'
                }
                if (type === 0 && status === 1) {
                    return 'Deposit Request(Paid)'
                }
                if (type === 0 && status === 2) {
                    return 'Deposit Request(Reject)'
                }
                if (type === 3 && status === 1) {
                    return 'Withdraw Request(Pending)'
                }
                if (type === 3 && status === 1) {
                    return 'Withdraw Request(Paid)'
                }
                if (type === 3 && status === 2) {
                    return 'Withdraw Request(Reject)'
                }
                if (type === 1) {
                    return 'Game Deduct'
                }
                if (type === 2) {
                    return 'Game Won'
                }
                if (type === 4) {
                    return 'Penalty'
                }
                if (type === 5) {
                    return 'refund'
                }
                if (type === 6) {
                    return 'Refferal'
                }
                if (type === 7) {
                    return 'Bonus'
                }
            }

            allUserTransactionList = allUserTransactionList?.map(item => {
                item.statuss = checkType(item?.type, item?.status)
                return item
            })

            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../../pdf/user_transaction_history.csv'),
                header: [
                    { id: 'userName', title: 'Transaction Id' },
                    { id: 'statuss', title: 'Type' },
                    { id: 'amount', title: 'Amount' },
                    { id: 'createdAt', title: 'Date&Time' }
                ],
            });

            csvWriter.writeRecords(allUserTransactionList)
                .then(() => {
                    const url = process.env.API_URL + '/user_transaction_history.csv'
                    return res.success({ url }, 'CSV Download file successfully.')
                })
                .catch((error) => {
                    console.error('Error writing CSV:', error);
                    // res.status(500).send('Error generating the CSV file');
                });

        } catch (err) {
            return next(err);
        }
    }

}

module.exports = new UserController()
