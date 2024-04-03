const { User, Wallet, Address, Game, Bank, Kyc, Pool,UserGame, Transaction, Notification, Slide, SocialLink } = require('../db/models/User.model')
const Setting = require('../db/models/setting.model')
const { uploadImageAPI } = require('../lib/util')
const multiparty = require('multiparty')
const request = require('request')
const _ = require('lodash')
const moment = require('moment')
const mongoose = require("mongoose");
// const fs = require('fs').promises;
const fs = require('fs')
const path = require('path');
const Razorpay = require('razorpay')
const { RZ_KEY, RZ_SECRET } = process.env;
const crypto = require('crypto');



class UserController {

    async editProfile(req, res, next) {
        try {
            const user = await User.findOne({ _id: req._id });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const form = new multiparty.Form();
            const { fields, files } = await parseFormAsync(form, req);

            for (const key in fields) {
                if (fields.hasOwnProperty(key)) {
                    user[key] = fields[key][0];
                }
            }
            console.log("------------------->>>>>",fields,files)

            if (files.avatar && files.avatar[0].originalFilename) {
                const fileupload = files.avatar[0];
                const uploadDir = 'uploads/profile';
                let file_name=Date.now()+fileupload.originalFilename;
                const uploadPath = path.join(uploadDir, file_name);
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                user.avatar = path.relative('uploads', uploadPath);
                console.log(user.avatar,"pppppppppppppppppppppppppppppppppppppppppppp")

            }

            let user_ = await user.save();

            return res.status(200).json({ success: true, message: 'Profile update successfully', data: { user: user_ } });
        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    async createProfile(req, res, next) {
        try {
            const user = await User.findOne({ _id: req._id });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }


            const form = new multiparty.Form();
            const { fields, files } = await parseFormAsync(form, req);

            for (const key in fields) {
                if (fields.hasOwnProperty(key)) {
                    user[key] = fields[key][0];
                }
            }

            if (files.avatar && files.avatar[0].originalFilename) {
                
                const fileupload = files.avatar[0];
                const uploadDir = 'uploads/profile';
                let file_name=Date.now()+fileupload.originalFilename;
                const uploadPath = path.join(uploadDir, file_name);
                console.log(uploadPath,"88888888888888888888888")

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                user.avatar = path.relative('uploads', uploadPath);
            }

            let user_ = await user.save();
            return res.status(200).json({ success: true, message: 'Profile created successfully', data: { user: user_ } });

        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    async getProfile(req, res, next) {
        try {

            let user = await User.aggregate([
                {
                    $match: {
                        _id: req._id
                    }
                },
                {
                    $lookup: {
                        from: "wallets",
                        localField: "_id",
                        foreignField: "userId",
                        as: "userWallet"
                    }
                },
                {
                    $project: {
                        password: 0,
                        otp: 0
                    }
                }
            ]);

            return res.success({ user }, "profile found successfully");

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async uploadKYC(req, res, next) {
        try {
            const user = await User.findOne({ _id: req._id });

            if (user.kyc) {
                return res.status(404).json({ success: false, message: 'KYC already verified' });
            }

            const form = new multiparty.Form();
            const { fields, files } = await parseFormAsync(form, req);
            let kyc = new Kyc();

            kyc['userId'] = req._id;
            for (const key in fields) {
                if (fields.hasOwnProperty(key)) {
                    kyc[key] = fields[key][0];
                }
            }

            console.log(files)

            if (files.adhaarFront && files.adhaarFront[0].originalFilename) {
                const fileupload = files.adhaarFront[0];
                const uploadDir = 'uploads/kyc';
                let file_name=Date.now()+fileupload.originalFilename;
                const uploadPath = path.join(uploadDir, file_name);
                console.log(uploadPath)

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                kyc.adhaarFront = path.relative('uploads', uploadPath);
            }

            if (files.adhaarBack && files.adhaarBack[0].originalFilename) {
                const fileupload = files.adhaarBack[0];
                const uploadDir = 'uploads/kyc';
                let file_name=Date.now()+fileupload.originalFilename;
                const uploadPath = path.join(uploadDir, file_name);
                console.log(uploadPath)

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                kyc.adhaarBack = path.relative('uploads', uploadPath);
                
            }

            if (files.panFront && files.panFront[0].originalFilename) {

                const fileupload = files.panFront[0];
                const uploadDir = 'uploads/kyc';
                let file_name=Date.now()+fileupload.originalFilename;
                const uploadPath = path.join(uploadDir, file_name);
                console.log(uploadPath)

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                kyc.panFront = path.relative('uploads', uploadPath);
            }

            if (files.panBack && files.panBack[0].originalFilename) {

                const fileupload = files.panBack[0];
                const uploadDir = 'uploads/kyc';
                let file_name=Date.now()+fileupload.originalFilename;
                const uploadPath = path.join(uploadDir, file_name);
                console.log(uploadPath)

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                kyc.panBack = path.relative('uploads', uploadPath);
            }

            user.kyc = 1;
            await user.save();
            let _kyc = await kyc.save();
            return res.status(200).json({ success: true, message: 'KYC uploaded successfully', data: { kyc: _kyc } });

            // return res.status(200).json({ kyc,success: true, message: 'Done'})
        } catch (err) {
            console.error(err);
            return next(err);
        }
    }


    async saveAddress(req, res, next) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { houseNumber, route, wardNumber, city, state, zipCode, country } = req.body;

            await updateDefaultAddress(req._id, session);

            const newAddress = new Address({
                houseNumber,
                route,
                wardNumber,
                city,
                state,
                zipCode,
                country,
                userId: req._id
            });

            await newAddress.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.success({ newAddress }, 'Address added successfully');
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            console.error(err);
            return next(err);
        }
    }

    async updateKyc(req, res, next) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { houseNumber, route, wardNumber, city, state, zipCode, country } = req.body;

            await updateDefaultAddress(req._id, session);

            const newAddress = new Address({
                houseNumber,
                route,
                wardNumber,
                city,
                state,
                zipCode,
                country,
                userId: req._id
            });

            await newAddress.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.success({ newAddress }, 'Address added successfully');
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            console.error(err);
            return next(err);
        }
    }

    async deleteAddress(req, res, next) {
        try {
            const { addressId } = req.body;
            const deletedAddress = await Address.findOneAndDelete({ userId: req._id, _id: addressId });

            if (!deletedAddress) {
                return res.status(404).json({ error: 'Address not found' });
            }

            return res.success({}, 'Address deleted successfully');

        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    async depositHistory(req, res, next) {
        try {

            let transactions = await Transaction.find({ userId: req._id, type: 0 }).lean();

            // const data = [
            //     {
            //         userId: '65b49685bf4ac3a388d4f82c',
            //         _id: '65b49685bf4ac3a388d4f82c',
            //         type: 0, 
            //         status: 1,
            //         msg: 'Deposit successful',
            //         rz_order_id: 'rz_order_id_1',
            //         amount: 100,
            //         gameId: null, 
            //         createdAt:"2024-01-27T17:37:09.359Z",
            //         updatedAt:"2024-01-27T17:37:09.359Z",
            //     },
            //     {
            //         userId: "65b49685bf4ac3a388d4f82c",
            //         _id: '65b49685bf4ac3a388d4f82c',
            //         type: 0, 
            //         status: 1,
            //         msg: 'Deposit successful',
            //         rz_order_id: 'rz_order_id_2',
            //         amount: 20,
            //         gameId: null, 
            //         createdAt:"2024-01-27T15:37:09.359Z",
            //         updatedAt:"2024-01-27T15:37:09.359Z",
            //     },
            //     {
            //         userId: "65b49685bf4ac3a388d4f82c",
            //         _id:"65b49685bf4ac3a388d4fggrg",
            //         type: 0, // 2=game won
            //         status: 1,
            //         msg: 'Deposit successful',
            //         rz_order_id: 'rz_order_id_3',
            //         amount: 50,
            //         gameId:null,
            //         createdAt:"2024-01-27T13:37:09.359Z",
            //         updatedAt:"2024-01-27T13:37:09.359Z",
            //     },
            //     {
            //         userId: "65b49685bf4ac3a388d4f82c", 
            //         _id:"65b49685bf4ac3a388d4feedc",
            //         type: 0, // 3=withd
            //         status: 1,
            //         msg: 'Deposit successful',
            //         rz_order_id: 'rz_order_id_4',
            //         amount: 30,
            //         gameId: null, 
            //         createdAt:"2024-01-27T12:37:09.359Z",
            //         updatedAt:"2024-01-27T12:37:09.359Z",
            //     },
            //     {
            //         userId: "65b49685bf4ac3a388d4f82c", 
            //         _id:"65b49685bf4ac3a388d4feed3",
            //         type: 0, // 4=pen
            //         status: 1,
            //         msg: 'Deposit successful',
            //         rz_order_id: 'rz_order_id_5',
            //         amount: 10,
            //         gameId: null, 
            //         createdAt:"2024-01-24T10:37:09.359Z",
            //         updatedAt:"2024-01-24T10:37:09.359Z",
            //     },
            //     {
            //         userId: "65b49685bf4ac3a388d4f82c", 
            //         _id:"65b49685bf4ac3a388d4wdwadcs",
            //         type: 0, // 5=refund
            //         status: 1,
            //         msg: 'Deposit successful',
            //         rz_order_id: 'rz_order_id_6',
            //         amount: 15,
            //         gameId: null,
            //         createdAt:"2024-01-27T10:37:09.359Z",
            //         updatedAt:"2024-01-27T10:37:09.359Z",
            //     },
                
            // ];





            return res.success({ transactions:transactions }, "User's deposit list");

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async withdrawHistory(req, res, next) {
        try {

            //0=deposit,1=game ded,2=game won,3=withd,4=pen,5=refund
            let transactions = await Transaction.find({ userId: req._id, type: 3 }).lean();


            // const data = [
            //     {
            //         _id:"659c3fdd9b22fdcebbdd7e88",
            //         userId: "mongoose.Types.ObjectId()",
            //         type: 3,
            //         status: 1,
            //         msg: 'Withdrawal successful',
            //         amount: 100,
            //         createdAt:"2024-01-27T17:37:09.359Z",
            //         updatedAt:"2024-01-27T17:37:09.359Z",
            //     },
            //     {
            //         _id:"659c3fdd9b22fdcebbdd7e76",
            //         userId: "mongoose.Types.ObjectId()", 
            //         type: 3, 
            //         status: 1,
            //         msg: 'Withdrawal successful',
            //         amount: 20,
            //         createdAt:"2024-01-27T05:37:09.359Z",
            //         updatedAt:"2024-01-27T05:37:09.359Z",
            //     },
            //     {
            //         _id:"659c3fdd9b22fdcebbdd2e34",
            //         userId: "mongoose.Types.ObjectId()", 
            //         type: 3, 
            //         status: 1,
            //         msg: 'Withdrawal successful',
            //         amount: 50,
            //         createdAt:"2024-01-27T10:37:09.359Z",
            //         updatedAt:"2024-01-27T10:37:09.359Z",
            //     },
            //     {
            //         _id:"659c3fdd9b22fdcebbfr7e34",
            //         userId: "mongoose.Types.ObjectId()", 
            //         type: 3, 
            //         status: 1,
            //         msg: 'Withdrawal successful',
            //         amount: 30,
            //         createdAt:"2024-01-24T05:37:09.359Z",
            //         updatedAt:"2024-01-24T05:37:09.359Z",
            //     },
            //     {
            //         _id:"659c3fddd222fdcebbdd7e88",
            //         userId: "mongoose.Types.ObjectId()", 
            //         type: 3, 
            //         status: 1,
            //         msg: 'Withdrawal successful',
            //         amount: 10,
            //         createdAt:"2024-01-26T05:37:09.359Z",
            //         updatedAt:"2024-01-26T05:37:09.359Z",
            //     },
            //     {
            //         _id:"659c3fddw22fdcebbdd7e88",
            //         userId: "mongoose.Types.ObjectId()", 
            //         type: 3, // 5=refund
            //         status: 1,
            //         msg: 'Withdrawal successful',
            //         amount: 15,
            //         gameId: "mongoose.Types.ObjectId()",
            //         createdAt:"2024-01-23T06:37:09.359Z",
            //         updatedAt:"2024-01-23T06:37:09.359Z",
            //     },
            //     // Add more entries if needed
            // ];






            return res.success({ transactions:transactions }, "User's Withdraw list");

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async quizHistory(req, res, next) {
        try {
            let quizs = await UserGame.find({ userId: req._id }).populate('gameId');

            // const data=[
            //     {
            //       "_id": "UserGameId1",
            //       "gameId": {
            //         "_id": "GameId1",
            //         "gameNameInHindi": "खेल 1 हिन्दी में",
            //         "gameNameInEnglish": "Game 1 in English",
            //         "category": "Adventure",
            //         "startedAt": 1643209200,
            //         "endedAt": 1643212800,
            //         "entranceAmount": 50,
            //         "noOfQuestion": 10,
            //         "noOfParticipation": 100,
            //         "noOfPrice": 3,
            //         "pricePool": 500,
            //         "joinedMember": 0,
            //         "isCompleted": false,
            //         "schedule": 1643205600,
            //         "duration": 900000,
            //         "businessDate": 1643205600,
            //       },
            //       "userId": "UserId1", 
            //       "gameNameInHindi": "खेल 1 हिन्दी में",
            //       "gameNameInEnglish": "Game 1 in English",
            //       "transactionId": "TransactionId1", // Replace with the actual transaction ID
            //       "status": 1,
            //       "mainPoints": 0,
            //       "rawPoints": 0,
            //       "rank": 1,
            //       "isCompleted": true,
            //       "amount": 50,
            //       "questAttempted": 0,
            //       "schedule": 1643205600,
            //       "businessDate": 1643205600,
            //       "wonAmount": 30,
            //       "type": "ENGLISH",
            //     },
            //     {
            //       "_id": "UserGameId2",
            //       "gameId": {
            //         "_id": "GameId2",
            //         "gameNameInHindi": "खेल 2 हिन्दी में",
            //         "gameNameInEnglish": "Game 2 in English",
            //         "category": "Puzzle",
            //         "startedAt": 1643212800,
            //         "endedAt": 1643216400,
            //         "entranceAmount": 30,
            //         "noOfQuestion": 8,
            //         "noOfParticipation": 75,
            //         "noOfPrice": 2,
            //         "pricePool": 300,
            //         "joinedMember": 0,
            //         "isCompleted": false,
            //         "schedule": 1643209200,
            //         "duration": 720000,
            //         "businessDate": 1643209200,
            //       },
            //       "userId": "UserId2", // Replace with the actual user ID
            //       "gameNameInHindi": "खेल 2 हिन्दी में",
            //       "gameNameInEnglish": "Game 2 in English",
            //       "transactionId": "TransactionId2", // Replace with the actual transaction ID
            //       "status": 1,
            //       "mainPoints": 0,
            //       "rawPoints": 0,
            //       "rank": 1,
            //       "isCompleted": true,
            //       "amount": 30,
            //       "questAttempted": 0,
            //       "schedule": 1643209200,
            //       "businessDate": 1643209200,
            //       "wonAmount": 50,
            //       "type": "ENGLISH",
            //     },
            //     {
            //       "_id": "UserGameId3",
            //       "gameId": {
            //         "_id": "GameId3",
            //         "gameNameInHindi": "खेल 3 हिन्दी में",
            //         "gameNameInEnglish": "Game 3 in English",
            //         "category": "Trivia",
            //         "startedAt": 1643216400,
            //         "endedAt": 1643220000,
            //         "entranceAmount": 20,
            //         "noOfQuestion": 5,
            //         "noOfParticipation": 50,
            //         "noOfPrice": 1,
            //         "pricePool": 150,
            //         "joinedMember": 0,
            //         "isCompleted": false,
            //         "schedule": 1643212800,
            //         "duration": 600000,
            //         "businessDate": 1643212800,
            //       },
            //       "userId": "UserId3", // Replace with the actual user ID
            //       "gameNameInHindi": "खेल 3 हिन्दी में",
            //       "gameNameInEnglish": "Game 3 in English",
            //       "transactionId": "TransactionId3", // Replace with the actual transaction ID
            //       "status": 1,
            //       "mainPoints": 0,
            //       "rawPoints": 0,
            //       "rank": 1,
            //       "isCompleted": true,
            //       "amount": 20,
            //       "questAttempted": 0,
            //       "schedule": 1643212800,
            //       "businessDate": 1643212800,
            //       "wonAmount": 10,
            //       "type": "ENGLISH",
            //     }
            //     // Add more entries if needed
            //   ]
              
            return res.success({ quizs:quizs }, "User's quizs fetched successfully");
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async refHistory(req, res, next) {
        try {
            let refReward = await Transaction.find({ userId: req._id,type:6 }).populate('refUserId');

        //    const data = [
        //         {
        //             _id:"659c3fdd9b22fdcebbdd7e88",
        //             userId: "mongoose.Types.ObjectId()",
        //             type:6,
        //             status: 1,
        //             msg: "Referral Reward",
        //             amount: 100,
        //             refUserId: {
        //                 "_id": "UserId1",
        //                 "name": "Sanjay",
        //                 "id": "PD213231",
        //                 "mobile": "1234567890",
        //                 "email": "user1@example.com",
        //                 "role": "USER",
        //                 "avatar": "",
        //                 "otp": "1234",
        //                 "isVerified": false,
        //                 "deviceType": "iOS",
        //                 "deviceToken": "device_token_1",
        //                 "deviceId": "device_id_1",
        //                 "street_address": "Street 1",
        //                 "city": "City 1",
        //                 "state": "State 1",
        //                 "country": "Country 1",
        //                 "pincode": "123456",
        //                 "notification": true,
        //                 "authTokenIssuedAt": 1643190000,
        //                 "status": true,
        //                 "kyc": 0,
        //                 "createdAt": "2024-01-26T12:00:00.000Z",
        //                 "updatedAt": "2024-01-26T12:00:00.000Z"
        //               },
        //             createdAt:"2024-01-27T17:37:09.359Z",
        //             updatedAt:"2024-01-27T17:37:09.359Z",
        //         },
        //         {
        //             _id:"659c3fdd9b22fdcebbdd7e76",
        //             userId: "mongoose.Types.ObjectId()", 
        //             type:6, 
        //             status: 1,
        //             msg: "Referral Reward",
        //             amount: 20,
        //             refUserId: {
        //                 "_id": "UserId1",
        //                 "name": "Sanju",
        //                 "id": "PD213231",
        //                 "mobile": "1234567890",
        //                 "email": "user1@example.com",
        //                 "role": "USER",
        //                 "avatar": "",
        //                 "otp": "1234",
        //                 "isVerified": false,
        //                 "deviceType": "iOS",
        //                 "deviceToken": "device_token_1",
        //                 "deviceId": "device_id_1",
        //                 "street_address": "Street 1",
        //                 "city": "City 1",
        //                 "state": "State 1",
        //                 "country": "Country 1",
        //                 "pincode": "123456",
        //                 "notification": true,
        //                 "authTokenIssuedAt": 1643190000,
        //                 "status": true,
        //                 "kyc": 0,
        //                 "createdAt": "2024-01-26T12:00:00.000Z",
        //                 "updatedAt": "2024-01-26T12:00:00.000Z"
        //               },
        //             createdAt:"2024-01-27T05:37:09.359Z",
        //             updatedAt:"2024-01-27T05:37:09.359Z",
        //         },
        //         {
        //             _id:"659c3fdd9b22fdcebbdd2e34",
        //             userId: "mongoose.Types.ObjectId()", 
        //             type:6, 
        //             status: 1,
        //             msg: "Referral Reward",
        //             amount: 50,
        //             refUserId: {
        //                 "_id": "UserId1",
        //                 "name": "Ajeet",
        //                 "id": "PD213231",
        //                 "mobile": "1234567890",
        //                 "email": "user1@example.com",
        //                 "role": "USER",
        //                 "avatar": "",
        //                 "otp": "1234",
        //                 "isVerified": false,
        //                 "deviceType": "iOS",
        //                 "deviceToken": "device_token_1",
        //                 "deviceId": "device_id_1",
        //                 "street_address": "Street 1",
        //                 "city": "City 1",
        //                 "state": "State 1",
        //                 "country": "Country 1",
        //                 "pincode": "123456",
        //                 "notification": true,
        //                 "authTokenIssuedAt": 1643190000,
        //                 "status": true,
        //                 "kyc": 0,
        //                 "createdAt": "2024-01-26T12:00:00.000Z",
        //                 "updatedAt": "2024-01-26T12:00:00.000Z"
        //               },
        //             createdAt:"2024-01-27T10:37:09.359Z",
        //             updatedAt:"2024-01-27T10:37:09.359Z",
        //         },
        //         {
        //             _id:"659c3fdd9b22fdcebbfr7e34",
        //             userId: "mongoose.Types.ObjectId()", 
        //             type:6, 
        //             status: 1,
        //             msg: "Referral Reward",
        //             amount: 30,
        //             refUserId: {
        //                 "_id": "UserId1",
        //                 "name": "Mahendra",
        //                 "id": "PD213231",
        //                 "mobile": "1234567890",
        //                 "email": "user1@example.com",
        //                 "role": "USER",
        //                 "avatar": "",
        //                 "otp": "1234",
        //                 "isVerified": false,
        //                 "deviceType": "iOS",
        //                 "deviceToken": "device_token_1",
        //                 "deviceId": "device_id_1",
        //                 "street_address": "Street 1",
        //                 "city": "City 1",
        //                 "state": "State 1",
        //                 "country": "Country 1",
        //                 "pincode": "123456",
        //                 "notification": true,
        //                 "authTokenIssuedAt": 1643190000,
        //                 "status": true,
        //                 "kyc": 0,
        //                 "createdAt": "2024-01-26T12:00:00.000Z",
        //                 "updatedAt": "2024-01-26T12:00:00.000Z"
        //               },
        //             createdAt:"2024-01-24T05:37:09.359Z",
        //             updatedAt:"2024-01-24T05:37:09.359Z",
        //         },
        //         {
        //             _id:"659c3fddd222fdcebbdd7e88",
        //             userId: "mongoose.Types.ObjectId()", 
        //             type:6, 
        //             status: 1,
        //             msg: "Referral Reward",
        //             amount: 10,
        //             refUserId: {
        //                 "_id": "UserId1",
        //                 "name": "Raja",
        //                 "id": "PD213231",
        //                 "mobile": "1234567890",
        //                 "email": "user1@example.com",
        //                 "role": "USER",
        //                 "avatar": "",
        //                 "otp": "1234",
        //                 "isVerified": false,
        //                 "deviceType": "iOS",
        //                 "deviceToken": "device_token_1",
        //                 "deviceId": "device_id_1",
        //                 "street_address": "Street 1",
        //                 "city": "City 1",
        //                 "state": "State 1",
        //                 "country": "Country 1",
        //                 "pincode": "123456",
        //                 "notification": true,
        //                 "authTokenIssuedAt": 1643190000,
        //                 "status": true,
        //                 "kyc": 0,
        //                 "createdAt": "2024-01-26T12:00:00.000Z",
        //                 "updatedAt": "2024-01-26T12:00:00.000Z"
        //               },
        //             createdAt:"2024-01-26T05:37:09.359Z",
        //             updatedAt:"2024-01-26T05:37:09.359Z",
        //         },
        //         {
        //             _id:"659c3fddw22fdcebbdd7e88",
        //             userId: "mongoose.Types.ObjectId()", 
        //             type:6, // 5=refund
        //             status: 1,
        //             msg: "Referral Reward",
        //             amount: 15,
        //             refUserId: {
        //                 "_id": "UserId1",
        //                 "name": "Ramesh",
        //                 "id": "PD213231",
        //                 "mobile": "1234567890",
        //                 "email": "user1@example.com",
        //                 "role": "USER",
        //                 "avatar": "",
        //                 "otp": "1234",
        //                 "isVerified": false,
        //                 "deviceType": "iOS",
        //                 "deviceToken": "device_token_1",
        //                 "deviceId": "device_id_1",
        //                 "street_address": "Street 1",
        //                 "city": "City 1",
        //                 "state": "State 1",
        //                 "country": "Country 1",
        //                 "pincode": "123456",
        //                 "notification": true,
        //                 "authTokenIssuedAt": 1643190000,
        //                 "status": true,
        //                 "kyc": 0,
        //                 "createdAt": "2024-01-26T12:00:00.000Z",
        //                 "updatedAt": "2024-01-26T12:00:00.000Z"
        //               },
        //             createdAt:"2024-01-23T06:37:09.359Z",
        //             updatedAt:"2024-01-23T06:37:09.359Z",
        //         },
        //         // Add more entries if needed
        //     ];
              
            return res.success({ refReward:refReward }, "User's quizs fetched successfully");
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }


    async Test(req, res, next) {
        try {
            return res.success({});
        } catch (err) {
            return next(err);
        }
    }

    async AboutUs(req, res) {

        let setting = await Setting.findOne().lean();
        return res.success({ data:setting.aboutUs }, "About Us");
    }

    async Privacy(req, res) {
        let setting = await Setting.findOne().lean();
        return res.success({ data:setting.privacyPolicy }, "Privacy Policy");
    }

    async Faq(req, res) {

        const data = [
            {
                "question": "What are you selling?",
                "answer": "You should submit valid forms of payment information"
            },
            {
                "question": "What does the guarantee cover? ",
                "answer": "Company FAQ pages about billing and payment processing are also some issues that concern customers the most."
            },
            {
                "question": "Where can I find you?",
                "answer": "Fashion, Apparel & Accessories industry is one of the industries with constant growth over the past many years."
            },
            {
                "question": "How might I get in touch with you?",
                "answer": "Below is some common questions that people"
            }
        ]


        return res.success({ data }, 'faq');
    }
    async refundPolicy(req, res) {

        let setting = await Setting.findOne().lean();
        return res.success({ data:setting.refundCancellation }, "Refund Cancellation");

    }
    async TermsAndCondition(req, res) {
        let setting = await Setting.findOne().lean();
        return res.success({ data:setting.termsAndCondition }, "Terms And Condition");
    }

    async getLogo(req, res, next) {
        try {

            let setting = await Setting.findOne().lean()
            return res.success({ logo:setting.logo }, "Get logo");

        } catch (err) {
            return next(err);
        }
    }

    async  slideList(req, res, next) {
        try {

            let setting = await Setting.findOne().lean();
            const slides=[{img:setting.ad1},{img:setting.ad2},{img:setting.ad3},{img:setting.ad4}];
            return res.success({ slides }, "Slides List");

        } catch (err) {
            return next(err);
        }
    }

    async  HowToPlay(req, res, next) {
        try {

            let setting = await Setting.findOne().lean();
            return res.success({ img:setting.playImageLink }, "How to Play");

        } catch (err) {
            return next(err);
        }
    }

    async socialLinks(req, res, next) {
        try {

            let setting = await Setting.findOne().lean();

            console.log("==------------------000000000000000000-----------------",setting)

            const data=[
                {
                    "Name":"WHATSAPP",
                    "Link":setting.whatsappLink
                },
                {
                    "Name":"TELEGRAM",
                    "Link":setting.telegramLink
                },
                {
                    "Name":"YOUTUBE",
                    "Link":setting.youtubeLink
                },
                // {
                //     "Name":"INSTAGRAM",
                //     "Link":setting.youtubeLink
                // },
                {
                    "Name":"EMAIL",
                    "Link":setting.email
                },
            ]
            return res.success({ links:data }, "Social List");

        } catch (err) {
            return next(err);
        }
    }


    // try {
    //     const user = await User.findOne({ _id: req._id });

    //     if (!user) {
    //         return res.status(404).json({ success: false, message: 'User not found' });
    //     }

    //     const form = new multiparty.Form();
    //     const { fields, files } = await parseFormAsync(form, req);

    //     for (const key in fields) {
    //         if (fields.hasOwnProperty(key)) {
    //             user[key] = fields[key][0];
    //         }
    //     }

    //     if (files.image && files.image[0].originalFilename) {
    //         const fileupload = files.image[0];
    //         const uploadDir = 'public/kyc';
    //         const uploadPath = path.join(uploadDir, fileupload.originalFilename);

    //         if (!fs.existsSync(uploadDir)) {
    //             fs.mkdirSync(uploadDir, { recursive: true });
    //         }

    //         fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
    //         user.avatar = path.relative('public', uploadPath);
    //     }

    //     let user_ = await user.save();

    //     return res.status(200).json({ success: true, message: 'Profile created successfully', data: { user: user_ } });
    // } catch (err) {
    //     console.error(err);
    //     return next(err);
    // }



    async addSlide(req, res, next) {
        try {
            const slide = new Slide({});



            const form = new multiparty.Form();
            const { fields, files } = await parseFormAsync(form, req);

            for (const key in fields) {
                if (fields.hasOwnProperty(key)) {
                    slide[key] = fields[key][0];
                }
            }

            // if (files.slide && files.slide[0].originalFilename) {
            //     const fileupload = files.slide[0];
            //     const contents = await fs.readFile(fileupload.path, { encoding: 'base64' });
            //     slide.slide = contents;
            // }


            if (files.slide && files.slide[0].originalFilename) {
                const fileupload = files.slide[0];
                const uploadDir = 'uploads/slides';
                const uploadPath = path.join(uploadDir, fileupload.originalFilename);
                console.log(uploadPath)

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                fs.writeFileSync(uploadPath, fs.readFileSync(fileupload.path));
                console.log(path.relative('uploads', uploadPath))
                slide.slide = path.relative('uploads', uploadPath);
            }

            let _slide = await slide.save();

            return res.status(200).json({ success: true, message: 'Profile update successfully', data: { slide: _slide } });
        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    async addBalance(req, res, next) {
        try {
            let { balance } = req.body;
            const { email, mobile,name}=req.user;

            var instance = new Razorpay({
                key_id: RZ_KEY,
                key_secret: RZ_SECRET,
            });

            let _txn = new Transaction({
                userId: req._id,
                amount: balance,
                msg: 'Balance deposit',
                type: 0,
               // status: true
            });






            //   let wallet = await Wallet.findOne({ userId: req._id })
            //   if (wallet) {
            //       wallet.balance += Number(balance);
            //       wallet.deposit += Number(balance);
            //       wallet.userId = req._id;
            //   } else {
            //       wallet = new Wallet({
            //           balance: Number(balance),
            //           deposit: Number(balance),
            //           userId: req._id
            //       })
            //   }



            var options = {
                amount: balance*100,
                currency: "INR",
                receipt: _txn._id,
                notes: {
                    description: "DEPOSIT"
                }
            };

            instance.orders.create(options, async function (err, order) {

                if (err) {
                    console.log(err);
                    _txn.remark = 'failed';
                    await _txn.save();
                    return res.warn({}, 'Something went wrong!');

                }
                console.log("Done   =========>",order);
                _txn.rz_order_id = order.id;
                _txn.remark = 'pending';
                const txn = await _txn.save();
                return res.success({ txn, order,email,mobile,name}, 'Order created successfully');
            });


        } catch (err) {
            console.error(err);
            return next(err);

        }
    }

    async withdrawBalance(req, res, next) {
        try {
            let { balance } = req.body;
            console.log(typeof balance,balance,"===============================================????>>>")
            balance=Number(balance);
            const setting=await Setting.findOne();
            const {withdrawCommission,minimumWithdraw}=setting;
            if(minimumWithdraw>balance){
                return res.warn({}, `Withdrawl amount must be greater than ${minimumWithdraw}`);
            }
            const wallet=await Wallet.findOne({userId:req._id});
            console.log(wallet?.winBalance,balance)
            
            if(wallet?.winBalance>balance){
                let comm=(balance*withdrawCommission)/100;
                console.log(comm);
                let _txn = new Transaction({
                    userId: req._id,
                    amount: balance,
                    withDamount:balance-comm,
                    msg: 'Balance withdraw',
                    type: 3,
                    status: 0
                });

                await _txn.save();

                wallet.balance-=balance;
                wallet.winBalance-=balance;
                wallet.holdBalance+=balance;
                await wallet.save();

                return res.success({ }, 'Withdraw request sent to Admin.');

            }else{
                return res.warn({}, 'Something went wrong!');
            }


        } catch (err) {
            console.error(err);
            return next(err);

        }
    }

    async addBalanceHook(req, res, next) {
        try {
            let { data } = req.body;

            console.log(data,"======HOOK=============--------->");
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

            const rz_data = razorpay_order_id + "|" + razorpay_payment_id;
            const generated_signature = crypto.createHmac('sha256', RZ_SECRET).update(rz_data).digest('hex');

            console.log(razorpay_signature)
            console.log(generated_signature)

            if (generated_signature == razorpay_signature) {

                const txn = await Transaction.findOne({ rz_order_id: razorpay_order_id });
                txn.remark = 'success';
                const amount = txn.amount;

                let wallet = await Wallet.findOne({ userId: req._id })
                if (wallet) {
                    wallet.balance += Number(amount);
                    wallet.deposit += Number(amount);
                    wallet.userId = req._id;
                } else {
                    wallet = new Wallet({
                        balance: Number(amount),
                        deposit: Number(amount),
                        userId: req._id
                    })
                }
                await wallet.save();
                return res.success({ wallet }, 'Wallet updated successfully');
            }

            return res.status(401).json({ success: false, message: 'Failed' });


        } catch (err) {
            console.error(err);
            return next(err);

        }
    }

    async Balance(req, res, next) {
        try {
            let { balance } = req.body;

            let wallet = await Wallet.findOne({ userId: req._id })
            if (wallet) {
                wallet.balance += Number(balance);
                wallet.deposit += Number(balance);
                wallet.userId = req._id;
            } else {
                wallet = new Wallet({
                    balance: Number(balance),
                    deposit: Number(balance),
                    userId: req._id
                })
            }


            await wallet.save();

            return res.success({ wallet }, 'Wallet added successfully');

        } catch (err) {
            console.error(err);
            return next(err);

        }
    }

    async myWallet(req, res, next) {
        try {
            let wallet = await Wallet.findOne({ userId: req._id })

            if (wallet) {
                return res.success({ wallet }, "wallet found")
            } else {
                return res.notFound({}, "wallet not found")
            }

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async addGame(req, res, next) {
        try {
            let { gameName, isCompleted, amount, schedule, entrance } = req.body;

            const game = new Game({
                gameName,
                isCompleted,
                amount,
                schedule,
                entrance
            })

            await game.save();

            return res.success({ game }, 'game added successfully');

        } catch (err) {
            console.error(err);
            return next(err);

        }
    }

    async addBank(req, res, next) {
        try {
            let { bank_name, account_holder, account_number, ifsc } = req.body;

            let bank = new Bank({
                userId: req._id,
                bank_name,
                account_holder,
                account_number,
                ifsc
            })

            await bank.save();

            return res.success({ bank }, 'Bank added successfully');


        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async getBank(req, res, next) {
        try {

            let bank = await Bank.findOne({ userId: req._id });

            if (bank) {
                return res.success({ bank }, "Bank found successfully");
            }

            return res.notFound({}, "Bank not found");

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }


    async getNotification(req, res, next) {
        try {

            let notifications = await Notification.find({ userId:req._id,isDeleted: false});
            if (notifications.length > 0) {
                return res.success({ notifications }, "Notification list");
            }
            return res.warn({}, "Notifications found");


        } catch (err) {
            console.log(err);
            return next(err);
        }
    }


    async saveNotification(req, res, next) {
        try {
            let { title, body } = req.body;

            let notification = new Notification({
                userId: req._id,
                title,
                body
            })

            await notification.save();
            return res.success({ notification }, 'Notification added successfully');

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async deleteNotification(req, res, next) {
        try {
            let { _id } = req.body;

            let notification = await Notification.findOneAndUpdate({ _id }, { isDeleted: true });
            if (notification) {
                return res.success({ notification }, 'Notification deleted successfully');
            } else {
                return res.warn({}, 'Something went wrong!');
            }

        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async referLink(req, res, next) {
        try {
            let { refferCode } = req.user;

            let setting = await Setting.findOne().lean();
            const link=setting.playStoreLink;
            return res.success({ link,refferCode:'PD132261' }, 'Refer page data');
            
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async playImageLink(req, res, next) {
        try {
            let { refferCode } = req.user;

            let setting = await Setting.findOne().lean();
            const playImageLink=setting.playImageLink;
            return res.success({ playImageLink }, 'Play Image Link');
            
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }



}

module.exports = new UserController()
async function updateDefaultAddress(userId, session) {
    await Address.updateMany({ userId }, { default: false }, { session });
}

function parseFormAsync(form, req) {
    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve({ fields, files });
            }
        });
    });
}