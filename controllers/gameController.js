const { User, Wallet, Address, Game,UserGame,Question,Transaction } = require('../db/models/User.model')
const { uploadImageAPI } = require('../lib/util')
const multiparty = require('multiparty')
const request = require('request')
const _ = require('lodash')
const moment = require('moment')
const mongoose = require("mongoose");
const { SANDBOX_HOST, API_KEY, VERSION } = process.env;

class GameController {


  async addGame(req, res, next) {
    try {
      let { gameName, startedAt, endedAt, amount, entrance } = req.body;

      const game = new Game({
        gameName,
        startedAt,
        endedAt,
        amount,
        entrance
      })

      await game.save();

      return res.success({ game }, 'game added successfully');

    } catch (err) {
      console.error(err);
      return next(err);

    }
  }

  async updateGame(req, res, next) {
    try {
      let { _id,type } = req.body;

      await UserGame.findOneAndUpdate({_id,userId:req._id},{ '$set': { type: type }});
      return res.success({  }, 'game updated successfully');

    } catch (err) {
      console.error(err);
      return next(err);

    }
  }

  async gameLang(req, res, next) {
    try {
      let { _id } = req.query;

      const myGame=await UserGame.findOne({_id});
      return res.success({ myGame }, 'Get game language!');

    } catch (err) {
      console.error(err);
      return next(err);

    }
  }

  async getQuestion(req, res, next) {
    try {
      let { gameId } = req.query;

      const game=await Game.aggregate([
        {
          $match:{
            _id: new mongoose.Types.ObjectId(gameId)
            // _id:gameId
          }
        },
        {
          $lookup: {
            from: 'questions',
            let: {
              gameId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$gameId', "$$gameId"] }
                    ],
                  },
                },
              }
            ],
            as: 'Questions',
          },
        }
      ]);

      const { duration,noOfQuestion,Questions}=game[0];
      const t=(duration/noOfQuestion);
      return res.success({ Questions,t,duration,noOfQuestion,interval:5000 }, 'Get questions!');
      

    } catch (err) {
      console.error(err);
      return next(err);

    }
  }


  async gameList(req, res, next) {
    try {
      let gameList = await Game.find({  })
      if (gameList.length>0) {
        return res.success({ gameList }, "game list")
      } else {
        return res.warn({}, "List not found")
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async myExam(req, res, next) {
    try {
      const { name, businessDate,type}=req.query;

      let query={}

      if (type=='LIVE') {
        query={
          userId: new mongoose.Types.ObjectId(req._id),
          schedule:{ $gt:Date.now()},
          isCompleted:false
        }
      }else if(type=='COMPLETED'){

        query={
          userId: new mongoose.Types.ObjectId(req._id),
          isCompleted:true
        }

      }

      if(name){
        const searchValue = new RegExp(
          name
            .split(' ')
            .filter(val => val)
            .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
            .join('|'),
          'i'
        );
        query.$or=[{gameNameInHindi:searchValue},{gameNameInEnglish:searchValue}];
      }

      if(businessDate){
        query.businessDate=businessDate;
      }


      let userGameList = await UserGame.aggregate([
        { 
          $match:query
        },
        {
          $lookup: {
            from: 'games',
            let: {
              gameId: '$gameId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', "$$gameId"] },
                      //{ $eq: ['$userId', new mongoose.Types.ObjectId(req._id)] }
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'usergames',
                  localField: '_id',
                  foreignField: 'gameId',
                  as: 'UserGame'
                }
              },
            ],
            as: 'Game',
          },
        },
      ]);

      if (userGameList.length>0) {
        return res.success({ userGameList }, "My Exam List")
      } else {
        return res.warn({}, "List not found")
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async HomePage(req, res, next) {
    try {

      const { name, businessDate}=req.query;
      let userGameList = await UserGame.aggregate([
        { 
          $match:{
            userId: req.user._id,
          }
        },
        { 
            $lookup: {
              from: 'games',
              localField: 'gameId',
              foreignField: '_id',
              as: 'Game'
    
          }
        },
        { 
          $lookup: {
            from: 'usergames',
            localField: 'gameId',
            foreignField: 'gameId',
            as: 'UserGame'
        }
      }
      ]);


      let query={
        isCompleted: false,
        schedule:{ $gt:Date.now()}
      }

      if(name){


        const searchValue = new RegExp(
          name
            .split(' ')
            .filter(val => val)
            .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
            .join('|'),
          'i'
        );
        query.$or=[{gameNameInHindi:searchValue},{gameNameInEnglish:searchValue}];
      }

      if(businessDate){
        query.businessDate=businessDate;
      }


      let upcomingGames = await Game.aggregate([
        {
          $match: query
        },
        {
          $lookup: {
            from: 'usergames',
            localField: '_id',
            foreignField: 'gameId',
            as: 'UserGame'
          }
        },
        {
          $lookup: {
            from: 'pools',
            localField: '_id',
            foreignField: 'gameId',
            as: 'Pool'
          }
        },
        {
          $addFields: {
            isJoined: {
              $cond: [{ $in: [req.user._id, '$UserGame.userId'] }, true, false]
            }
          }
        },
      ]);

      return res.success({ userGameList,upcomingGames }, 'Home page');
      
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async JoinPage(req, res, next) {
    const { _id}=req.query;
    try {
      
      let joingGame=await Game.aggregate([
        {
          $match:{
            _id:new mongoose.Types.ObjectId(_id)
          }
        },
        {
          $lookup: {
              from: 'usergames',
              let: {
                gameId: '$_id',
            },
              pipeline: [
                  {
                      $match: {
                          $expr: {
                              $and: [{ $eq: ['$gameId', "$$gameId"] }],
                          },
                      },
                  },
                
                  { 
                    $lookup: {
                      from: 'users',
                      localField: 'userId',
                      foreignField: '_id',
                      as: 'User'
                   }
                  },
              ],
              as: 'UserGame',
          },
       },
        // { 
  
        //   $lookup: {
        //     from: 'usergames',
        //     localField: '_id',
        //     foreignField: 'gameId',
        //     as: 'UserGame'
        //  }
        // },
        // {
        //   $unwind:"$UserGame"
        // },
        // { 
        //   $lookup: {
        //     from: 'users',
        //     localField: 'UserGame.userId',
        //     foreignField: '_id',
        //     as: 'User'
        //  }
        // },
        { 
  
          $lookup: {
            from: 'pools',
            localField: '_id',
            foreignField: 'gameId',
            as: 'GamePool'
         }
        },
        {
          $addFields: {
            isJoined: {
              $cond: [{ $eq: [req.user._id, '$UserGame.userId'] }, true, false]
            }
          }
        },
      ]);

      return res.success({ joingGame }, 'Join page');
      
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async addQuiz(req, res, next) {
    try {

      let { gameId, question, options, createdAt, isCompleted } = req.body;

      let questions = new Question({
        gameId,
        question,
        options,
        createdAt,
        isCompleted

      })

      await questions.save();

      return res.success({ questions }, 'questions added successfully');


    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async  joinGame(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      let { _id, amount, schedule } = req.body;
      let gameEx=await Game.findById(_id);

      
      if(!_id||!amount||!schedule){
        return res.status(400).json({ success: false, message: 'Data missing' });
      }
      if(gameEx.joinedMember>=gameEx.noOfParticipation){
        return res.status(403).json({ success: false, message: 'Already full' });
      }

      const isJoined=await UserGame.findOne({gameId:_id,userId:req._id});

      if(isJoined){
        return res.status(403).json({ success: false, message: 'Already Joined' });
      }

      gameEx.joinedMember=gameEx.joinedMember+1;
      await gameEx.save(session);

      // if((gameEx.schedule-900000)<Date.now()){
      //   return res.status(400).json({ success: false, message: 'Time Expired!' });
      // }
  
      let _txn = new Transaction({
        gameId: _id,
        userId: req._id,
        amount,
        msg: 'Joined Game',
        type: 1,
        status: 1
      });
      const txn = await _txn.save({ session });
  
      let userGames = new UserGame({
        gameId: _id,
        userId: req._id,
        amount,
        gameNameInHindi:gameEx.gameNameInHindi,
        gameNameInEnglish: gameEx.gameNameInEnglish,
        schedule:gameEx.schedule,
        businessDate: moment(gameEx.schedule).format('YYYYMMDD'),
        transactionId: txn._id,
        joinedAt:Date.now()
      });
  
      await userGames.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return res.success({ userGames }, 'User joined successfully');
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.log(err);
      return next(err);
    }
  }


  async quizList(req, res, next) {
    try {

      let quizLists = await Question.find({ isCompleted: true });
      if (quizLists) {
        return res.success({ quizLists }, "Quiz List");
      } else {
        return res.warn({}, "Quiz List not found");
      }

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async countQuestions(req, res, next) {
    const gameId = req.params.gameId;



    try {
      const aggregationPipeline = [
        {
          $match: { gameId: new mongoose.Types.ObjectId(gameId) }
        },
        {
          $group: {
            _id: '$gameId',
            totalQuestions: { $sum: 1 },
            questions: { $push: '$$ROOT' }
          }
        },
        {
          $lookup: {
            from: 'games',
            localField: '_id',
            foreignField: '_id',
            as: 'gameInfo'
          }
        },
        {
          $unwind: '$gameInfo'
        },
        {
          $project: {
            _id: 0,
            gameId: '$_id',
            totalQuestions: 1,
            questions: 1,
            gameInfo: {
              _id: 1,
              gameName: 1,
              startedAt: 1,
              endedAt: 1,
              isCompleted: 1,
              amount: 1,
              entrance: 1
            }
          }
        }
      ];

      const result = await Question.aggregate(aggregationPipeline);

      if (result.length > 0) {
        return res.json({ result });
      } else {
        return res.status(404).json({ message: 'No questions found for the given gameId' });
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async quizResult(req, res, next) {
    const { gameId,q_no}=req.query;
    try {

      let userId=req._id;

      if(req.query.userId){
        userId=req.query.userId;
      }

      let _gameQuestion=await Question.aggregate([
        {
          $match: {
            gameId: new mongoose.Types.ObjectId(gameId),
            q_no:Number(q_no)
          }
        },
        {
          $lookup: {
            from: 'userquestions',
            let: {
              questionId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$questionId', "$$questionId"] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'User'
                }
              },
              {
                $unwind:"$User"
              }
            ],
            as: 'UserQuestion',
          },
        },
        {
          $unwind:"$UserQuestion"
        },
        {
          $lookup: {
            from: 'games',
            localField: 'gameId',
            foreignField: '_id',
            as: 'Game'
          }
        },
        {
          $unwind:"$Game"
        },
        {
          $lookup: {
            from: 'userquestions',
            let: {
              questionId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$questionId', "$$questionId"] }
                    ],
                  },
                },
              }
            ],
            as: 'AllQuestions',
          },
        },
        {
          $lookup: {
            from: 'userquestions',
            let: {
              questionId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$questionId', "$$questionId"] },
                      // { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'User'
                }
              },
              {
                $unwind:"$User"
              }
            ],
            as: 'questionleaderShip',
          },
        },
        {
          $addFields: {
            question: "$questionInEnglish",
            options: "$optionsInEnglish",
            attempted: { $size: "$questionleaderShip" },
            not_attempted: {
              $subtract: [
                "$Game.noOfParticipation",
                { $size: "$questionleaderShip" }
                
              ]
            }
          },
        },
        
        {
          $project:{
            questionInEnglish:0,
            optionsInEnglish:0,
            questionInHindi: 0,
            optionsInHindi: 0
          }
        },
        
      ]);



      let gameQuestion = _gameQuestion[0]?_gameQuestion[0]:{};

      let correctCount = 0;
      let wrongCount = 0;
      const optionCounts = {};
      let correctPercentage=0;
      let wrongPercentage=0;
      const optionPercentages = {};
      const optionCount = {};
      

      if(gameQuestion){

        gameQuestion.questionleaderShip.forEach(leader => {
          if (leader.answer === gameQuestion.answer) {
            correctCount++;
          } else {
            wrongCount++;
          }
        });

         gameQuestion.questionleaderShip.sort(function (a, b) {
          if (b.mainPoints < a.mainPoints) {
            return -1;
          } else if (b.mainPoints > a.mainPoints) {
            return 1;
          } else {
            if (a.createdAt < b.createdAt) {
              return -1;
            } else if (a.createdAt > b.createdAt) {
              return 1;
            } else {
              return 0;
            }
          }
        });


        
  
        const totalQuestions = gameQuestion.questionleaderShip.length;
        correctPercentage = (correctCount / totalQuestions) * 100;
        wrongPercentage = (wrongCount / totalQuestions) * 100;
  
        
        let totalOptions = 0;
  
        gameQuestion.questionleaderShip.forEach(leader => {
          const chosenOptionId = leader.answer.toString();
          optionCounts[chosenOptionId] = (optionCounts[chosenOptionId] || 0) + 1;
          totalOptions++;
        });

        for(let i=0; i<gameQuestion.questionleaderShip.length; i++) {
          gameQuestion.questionleaderShip[i].rank=i+1;
        }
  
        
        gameQuestion.options.forEach(option => {
          const optionId = option.id.toString();
          const count = optionCounts[optionId] || 0;
          optionPercentages[optionId] = (count / totalOptions) * 100;
          optionCount[optionId]=count;
        });



      }
      
      gameQuestion.correctPercentage=correctPercentage;
      gameQuestion.wrongPercentage=wrongPercentage;
      gameQuestion.optionPercentages=optionPercentages;
      gameQuestion.correctCount=correctCount;
      gameQuestion.wrongCount=wrongCount;
      gameQuestion.optionCount=optionCount;

      
      return res.success({ gameQuestion :gameQuestion}, 'Quiz result page');
      
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async quizLeadership(req, res, next) {
    const { gameId}=req.body;
    try {

      let gameLeadership=await UserGame.aggregate([
        {
          $match: {
            gameId: new mongoose.Types.ObjectId(gameId)
          }
        },
        { 
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'User'
         }
        }
        // {
        //   $lookup: {
        //       from: 'usergames',
        //       let: {
        //         gameId: '$_id',
        //     },
        //       pipeline: [
        //           {
        //               $match: {
        //                   $expr: {
        //                       $and: [{ $eq: ['$gameId', "$$gameId"] }],
        //                   },
        //               },
        //           },
                
        //           { 
        //             $lookup: {
        //               from: 'users',
        //               localField: 'userId',
        //               foreignField: '_id',
        //               as: 'User'
        //            }
        //           },
        //       ],
        //       as: 'UserGame',
        //   },
        // }
      ]);

      // const data=[
      //   {
      //     "_id": "GameId1",
      //     "gameNameInHindi": "खेल 1 हिन्दी में",
      //     "gameNameInEnglish": "Game 1 in English",
      //     "category": "Adventure",
      //     "startedAt": 1643209200,
      //     "endedAt": 1643212800,
      //     "entranceAmount": 50,
      //     "noOfQuestion": 10,
      //     "noOfParticipation": 100,
      //     "noOfPrice": 3,
      //     "pricePool": 500,
      //     "isCompleted": false,
      //     "schedule": 1643205600,
      //     "duration": 900000,
      //     "businessDate": 1643205600,
      //     "UserGame": [
      //       {
      //         "_id": "UserGameId1",
      //         "gameId": "GameId1",
      //         "userId": "UserId1",
      //         "transactionId": "TransactionId1",
      //         "status": 1,
      //         "mainPoints": 100,
      //         "rawPoints": 120,
      //         "rank": 1,
      //         "isCompleted": true,
      //         "amount": 50,
      //         "schedule": 1643205600,
      //         "businessDate": 1643205600,
      //         "type": "ENGLISH",
      //         wonAmount:29,
      //         "User": [
      //           {
      //             "_id": "UserId1",
      //             "name": "User1",
      //             "id": "PD213231",
      //             "mobile": "1234567890",
      //             "email": "user1@example.com",
      //             "role": "USER",
      //             "avatar": "",
      //             "otp": "1234",
      //             "isVerified": false,
      //             "deviceType": "iOS",
      //             "deviceToken": "device_token_1",
      //             "deviceId": "device_id_1",
      //             "street_address": "Street 1",
      //             "city": "City 1",
      //             "state": "State 1",
      //             "country": "Country 1",
      //             "pincode": "123456",
      //             "notification": true,
      //             "authTokenIssuedAt": 1643190000,
      //             "status": true,
      //             "kyc": 0,
      //             "createdAt": "2024-01-26T12:00:00.000Z",
      //             "updatedAt": "2024-01-26T12:00:00.000Z"
      //           }
      //         ]
      //       },
      //       // Add 4 more user game entries for GameId1
      //       {
      //         "_id": "UserGameId2",
      //         "gameId": "GameId1",
      //         "userId": "UserId2",
      //         "transactionId": "TransactionId2",
      //         "status": 1,
      //         "mainPoints": 90,
      //         "rawPoints": 110,
      //         "rank": 2,
      //         "isCompleted": true,
      //         "amount": 50,
      //         "schedule": 1643205600,
      //         "businessDate": 1643205600,
      //         "type": "ENGLISH",
      //         wonAmount:60,
      //         "User": [
      //           {
      //             "_id": "UserId2",
      //             "name": "User2",
      //             "id": "PD213243",
      //             "mobile": "9876543210",
      //             "email": "user2@example.com",
      //             "role": "USER",
      //             "avatar": "",
      //             "otp": "5678",
      //             "isVerified": false,
      //             "deviceType": "Android",
      //             "deviceToken": "device_token_2",
      //             "deviceId": "device_id_2",
      //             "street_address": "Street 2",
      //             "city": "City 2",
      //             "state": "State 2",
      //             "country": "Country 2",
      //             "pincode": "654321",
      //             "notification": true,
      //             "authTokenIssuedAt": 1643190000,
      //             "status": true,
      //             "kyc": 0,
      //             "createdAt": "2024-01-26T12:00:00.000Z",
      //             "updatedAt": "2024-01-26T12:00:00.000Z"
      //           }
      //         ]
      //       },
      //       {
      //         "_id": "UserGameId3",
      //         "gameId": "GameId1",
      //         "userId": "UserId3",
      //         "transactionId": "TransactionId3",
      //         "status": 1,
      //         "mainPoints": 80,
      //         "rawPoints": 100,
      //         "rank": 3,
      //         "isCompleted": true,
      //         "amount": 50,
      //         "schedule": 1643205600,
      //         "businessDate": 1643205600,
      //         "type": "ENGLISH",
      //         wonAmount:30,
      //         "User": [
      //           {
      //             "_id": "UserId3",
      //             "name": "User3",
      //             "id": "PD213223",
      //             "mobile": "8765432109",
      //             "email": "user3@example.com",
      //             "role": "USER",
      //             "avatar": "",
      //             "otp": "4321",
      //             "isVerified": false,
      //             "deviceType": "iOS",
      //             "deviceToken": "device_token_3",
      //             "deviceId": "device_id_3",
      //             "street_address": "Street 3",
      //             "city": "City 3",
      //             "state": "State 3",
      //             "country": "Country 3",
      //             "pincode": "987654",
      //             "notification": true,
      //             "authTokenIssuedAt": 1643190000,
      //             "status": true,
      //             "kyc": 0,
      //             "createdAt": "2024-01-26T12:00:00.000Z",
      //             "updatedAt": "2024-01-26T12:00:00.000Z"
      //           }
      //         ]
      //       },
      //       {
      //         "_id": "UserGameId4",
      //         "gameId": "GameId1",
      //         "userId": "UserId4",
      //         "transactionId": "TransactionId4",
      //         "status": 1,
      //         "mainPoints": 70,
      //         "rawPoints": 90,
      //         "rank": 4,
      //         "isCompleted": true,
      //         "amount": 50,
      //         "schedule": 1643205600,
      //         "businessDate": 1643205600,
      //         "type": "ENGLISH",
      //         wonAmount:50,
      //         "User": [
      //           {
      //             "_id": "UserId4",
      //             "name": "User4",
      //             "id": "PD213233",
      //             "mobile": "7654321098",
      //             "email": "user4@example.com",
      //             "role": "USER",
      //             "avatar": "",
      //             "otp": "8765",
      //             "isVerified": false,
      //             "deviceType": "Android",
      //             "deviceToken": "device_token_4",
      //             "deviceId": "device_id_4",
      //             "street_address": "Street 4",
      //             "city": "City 4",
      //             "state": "State 4",
      //             "country": "Country 4",
      //             "pincode": "543210",
      //             "notification": true,
      //             "authTokenIssuedAt": 1643190000,
      //             "status": true,
      //             "kyc": 0,
      //             "createdAt": "2024-01-26T12:00:00.000Z",
      //             "updatedAt": "2024-01-26T12:00:00.000Z"
      //           }
      //         ]
      //       },
      //       {
      //         "_id": "UserGameId5",
      //         "gameId": "GameId1",
      //         "userId": "UserId5",
      //         "transactionId": "TransactionId5",
      //         "status": 1,
      //         "mainPoints": 60,
      //         "rawPoints": 80,
      //         "rank": 5,
      //         "isCompleted": true,
      //         "amount": 50,
      //         "schedule": 1643205600,
      //         "businessDate": 1643205600,
      //         "type": "ENGLISH",
      //         wonAmount:80,
      //         "User": [
      //           {
      //             "_id": "UserId5",
      //             "name": "User5",
      //             "id": "PD213123",
      //             "mobile": "6543210987",
      //             "email": "user5@example.com",
      //             "role": "USER",
      //             "avatar": "",
      //             "otp": "4321",
      //             "isVerified": false,
      //             "deviceType": "iOS",
      //             "deviceToken": "device_token_5",
      //             "deviceId": "device_id_5",
      //             "street_address": "Street 5",
      //             "city": "City 5",
      //             "state": "State 5",
      //             "country": "Country 5",
      //             "pincode": "210987",
      //             "notification": true,
      //             "authTokenIssuedAt": 1643190000,
      //             "status": true,
      //             "kyc": 0,
      //             "createdAt": "2024-01-26T12:00:00.000Z",
      //             "updatedAt": "2024-01-26T12:00:00.000Z"
      //           }
      //         ]
      //       }
      //     ]
      //   },
      //   // Add more games if needed
      // ]
      

      return res.success({ gameLeadership:gameLeadership }, 'Quiz Leadership page');
      
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }


  async winnersList(req, res, next) {
    try {

      const { name,businessDate}=req.query;
      let query={
        isCompleted:true
      };

      if(name){
        const searchValue = new RegExp(
          name
            .split(' ')
            .filter(val => val)
            .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
            .join('|'),
          'i'
        );
        query.$or=[{gameNameInHindi:searchValue},{gameNameInEnglish:searchValue}];
      }

      if(businessDate){
        query.businessDate=businessDate;
      }

      let joingGame=await Game.aggregate([
        {
          $match:query
        },
        {
          $lookup: {
            from: 'usergames',
            let: {
              gameId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$gameId', "$$gameId"] },
                     // { $eq: ['$userId', new mongoose.Types.ObjectId(req._id)] }
                    ],
                  },
                },
              }
            ],
            as: 'UserGame',
          },
        },
        {
          $addFields: {
            isJoined: {
              $cond: [{ $in: [req.user._id, '$UserGame.userId'] }, true, false]
            }
          }
        },
      ]);


      // const data=[
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 1 हिन्दी में",
      //     "gameNameInEnglish": "Game 1 in English",
      //     "category": "Adventure",
      //     "startedAt": 1643209200,
      //     "endedAt": 1643212800,
      //     "entranceAmount": 50,
      //     "noOfQuestion": 10,
      //     "noOfParticipation": 100,
      //     "noOfPrice": 3,
      //     "pricePool": 500,
      //     "isCompleted": false,
      //     "schedule": 1643205600,
      //     "duration": 900000,
      //     "businessDate": 1643205600,
      //     rank:2,
      //     isJoined:true
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 2 हिन्दी में",
      //     "gameNameInEnglish": "Game 2 in English",
      //     "category": "Action",
      //     "startedAt": 1643309200,
      //     "endedAt": 1643312800,
      //     "entranceAmount": 30,
      //     "noOfQuestion": 8,
      //     "noOfParticipation": 80,
      //     "noOfPrice": 2,
      //     "pricePool": 400,
      //     "isCompleted": true,
      //     "schedule": 1643305600,
      //     "duration": 800000,
      //     "businessDate": 1643305600,
      //     isJoined:false,
        
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 3 हिन्दी में",
      //     "gameNameInEnglish": "Game 3 in English",
      //     "category": "Puzzle",
      //     "startedAt": 1643409200,
      //     "endedAt": 1643412800,
      //     "entranceAmount": 40,
      //     "noOfQuestion": 12,
      //     "noOfParticipation": 120,
      //     "noOfPrice": 4,
      //     "pricePool": 600,
      //     "isCompleted": false,
      //     "schedule": 1643405600,
      //     "duration": 1000000,
      //     "businessDate": 1643405600,
      //     isJoined:true,
      //     rank:2,
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 4 हिन्दी में",
      //     "gameNameInEnglish": "Game 4 in English",
      //     "category": "Strategy",
      //     "startedAt": 1643509200,
      //     "endedAt": 1643512800,
      //     "entranceAmount": 25,
      //     "noOfQuestion": 6,
      //     "noOfParticipation": 60,
      //     "noOfPrice": 2,
      //     "pricePool": 300,
      //     "isCompleted": true,
      //     "schedule": 1643505600,
      //     "duration": 1200000,
      //     "businessDate": 1643505600,
      //     isJoined:true,
      //     rank:2,
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 5 हिन्दी में",
      //     "gameNameInEnglish": "Game 5 in English",
      //     "category": "Racing",
      //     "startedAt": 1643609200,
      //     "endedAt": 1643612800,
      //     "entranceAmount": 60,
      //     "noOfQuestion": 15,
      //     "noOfParticipation": 150,
      //     "noOfPrice": 5,
      //     "pricePool": 750,
      //     "isCompleted": false,
      //     "schedule": 1643605600,
      //     "duration": 1500000,
      //     "businessDate": 1643605600,
      //     isJoined:true,
      //     rank:6,
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 6 हिन्दी में",
      //     "gameNameInEnglish": "Game 6 in English",
      //     "category": "Sports",
      //     "startedAt": 1643709200,
      //     "endedAt": 1643712800,
      //     "entranceAmount": 35,
      //     "noOfQuestion": 9,
      //     "noOfParticipation": 90,
      //     "noOfPrice": 3,
      //     "pricePool": 450,
      //     "isCompleted": true,
      //     "schedule": 1643705600,
      //     "duration": 600000,
      //     "businessDate": 1643705600,
      //     isJoined:false
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 7 हिन्दी में",
      //     "gameNameInEnglish": "Game 7 in English",
      //     "category": "Simulation",
      //     "startedAt": 1643809200,
      //     "endedAt": 1643812800,
      //     "entranceAmount": 45,
      //     "noOfQuestion": 11,
      //     "noOfParticipation": 110,
      //     "noOfPrice": 4,
      //     "pricePool": 550,
      //     "isCompleted": false,
      //     "schedule": 1643805600,
      //     "duration": 1200000,
      //     "businessDate": 1643805600,
      //     isJoined:true,
      //     rank:7,
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 8 हिन्दी में",
      //     "gameNameInEnglish": "Game 8 in English",
      //     "category": "Educational",
      //     "startedAt": 1643909200,
      //     "endedAt": 1643912800,
      //     "entranceAmount": 55,
      //     "noOfQuestion": 13,
      //     "noOfParticipation": 130,
      //     "noOfPrice": 5,
      //     "pricePool": 650,
      //     "isCompleted": true,
      //     "schedule": 1643905600,
      //     "duration": 900000,
      //     "businessDate": 1643905600,
      //     isJoined:false
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 9 हिन्दी में",
      //     "gameNameInEnglish": "Game 9 in English",
      //     "category": "Casual",
      //     "startedAt": 1644009200,
      //     "endedAt": 1644012800,
      //     "entranceAmount": 20,
      //     "noOfQuestion": 5,
      //     "noOfParticipation": 50,
      //     "noOfPrice": 2,
      //     "pricePool": 250,
      //     "isCompleted": false,
      //     "schedule": 1644005600,
      //     "duration": 600000,
      //     "businessDate": 1644005600,
      //     isJoined:true,
      //     rank:2,
      //   },
      //   {
      //     _id:"659c3fdd9b22fdcebbdd7e88",
      //     "gameNameInHindi": "खेल 10 हिन्दी में",
      //     "gameNameInEnglish": "Game 10 in English",
      //     "category": "Strategy",
      //     "startedAt": 1644109200,
      //     "endedAt": 1644112800,
      //     "entranceAmount": 40,
      //     "noOfQuestion": 10,
      //     "noOfParticipation": 80,
      //     "noOfPrice": 3,
      //     "pricePool": 400,
      //     "isCompleted": true,
      //     "schedule": 1644105600,
      //     "duration": 1200000,
      //     "businessDate": 1644105600,
      //     isJoined:true,
      //     rank:9,
      //   }
      // ]
      

     // return res.success({  }, 'Join page');

     if (joingGame.length>0) {
        return res.success({ joingGame:joingGame }, "Winner list")
     } else {
       return res.warn({}, "List not found")
     }

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }


  async correctPercentage(req, res, next) {
    try {

      const { name,businessDate}=req.query;
      let query={
        isCompleted:true
      };

      if(name){
        const searchValue = new RegExp(
          name
            .split(' ')
            .filter(val => val)
            .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
            .join('|'),
          'i'
        );
        query.$or=[{gameNameInHindi:searchValue},{gameNameInEnglish:searchValue}];
      }


      let joingGame=await Game.aggregate([
        {
          $match:query
        },
        {
          $lookup: {
            from: 'usergames',
            let: {
              gameId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$gameId', "$$gameId"] },
                    //  { $eq: ['$userId', new mongoose.Types.ObjectId(req._id)] }
                    ],
                  },
                },
              }
            ],
            as: 'UserGame',
          },
        },
        {
          $addFields: {
            isJoined: {
              $cond: [{ $in: [req.user._id, '$UserGame.userId'] }, true, false]
            }
          }
        },
      ]);


     if (joingGame.length>0) {
        return res.success({ joingGame:joingGame }, "Correct Percentage Page")
     } else {
        return res.warn({}, "List not found")
     }


    } catch (err) {
      console.log(err);
      return next(err);
    }
  }


async getAnswer(req,res,next){

  try {

    let {questionId} =req.query;
    if(questionId){
      const question=await Question.aggregate([
        {
          $match: {
            _id:new mongoose.Types.ObjectId(questionId)
          }
        },
        {
          $lookup: {
            from: 'userquestions',
            let: {
              questionId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$questionId', "$$questionId"] }
                    ],
                  },
                },
              },
              {
                $sort:{
                  rank:1
                }
              }
            ],

            as: 'UserQuestion',
          },
        }
      ])

    
      return res.success({ question }, "Get answer")

    }else{
      return res.warn({}, "Something went wrong!")
    }

   
    
    // return callback({ data: question });

} catch (err) {
    console.log(err);
}

}
  








}

module.exports = new GameController()
