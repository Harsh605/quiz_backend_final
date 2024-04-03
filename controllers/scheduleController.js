const { User, Wallet, Address, Game, UserGame, Question, Transaction,Pool } = require('../db/models/User.model')
const Setting = require('../db/models/setting.model');
const request = require('request')
const _ = require('lodash')
const moment = require('moment')
const mongoose = require("mongoose");
ioClient = require('socket.io-client');



var socket = ioClient.connect(process.env.SOCKET_URL);
// var socket = ioClient.connect("http://3.111.23.56:5059/");


var gameIds = [];


// setInterval(async ()=>{
//   const games = await Game.findOne({_id:new mongoose.Types.ObjectId('65c1cd7559023bfa557eec8e') });

//   const { gameNameInHindi, gameNameInEnglish, entranceAmount, noOfQuestion, noOfParticipation, noOfPrice, pricePool } = games;
//   let game = new Game({
//     gameNameInHindi,
//     gameNameInEnglish,
//     entranceAmount,
//     noOfQuestion,
//     noOfParticipation,
//     noOfPrice,
//     pricePool,
//     startedAt:Date.now()+300000,
//     schedule:Date.now()+300000,
//     isCompleted: false,
//     endedAt: Date.now()+600000,
//   });
//   const gm=await game.save();

//   let p=await Pool.findOne({gameId:new mongoose.Types.ObjectId('65c1cd7559023bfa557eec8e')})

//   let pool = new Pool({
//     gameId: gm._id,
//     pool: p.pool
//   });

//   await pool.save();

//   const questionArray=await Question.find({gameId:new mongoose.Types.ObjectId('65c1cd7559023bfa557eec8e')}).lean()

//   for (let i = 0; i < questionArray.length; i++) {
//     const item = questionArray[i]
//     const question = new Question({
//       gameId: gm?._id,
//       questionInEnglish: item.questionInEnglish,
//       questionInHindi: item.questionInHindi,
//       optionsInEnglish: [
//         { id: 1, answer: item.option1Eng },
//         { id: 2, answer: item.option2Eng },
//         { id: 3, answer: item.option3Eng },
//         { id: 4, answer: item.option4Eng }
//       ],
//       optionsInHindi: [
//         { id: 1, answer: item.option1Hin },
//         { id: 2, answer: item.option2Hin },
//         { id: 3, answer: item.option3Hin },
//         { id: 4, answer: item.option4Hin }
//       ],
//       answer: item.answer
//     })

//     await question.save();
//   }

// },300000)



setInterval(async () => {
  const games = await Game.find({ isCompleted: false,startedAt:{$gt:Date.now()} });
  let setting = await Setting.findOne().lean();
  const { nextQuestionTiming, questionTiming } = setting;
  const tTime = (nextQuestionTiming + questionTiming) * 1000;
  for (const game of games) {
    if (!gameIds.includes(game._id.toString())) {
      console.log("+++++++++++++++++////////////////////SiNT")
      const schedule = game.startedAt;

      const duration = game.noOfQuestion * tTime;
      // await Game.findOneAndUpdate({ _id: game._id }, { $set: { schedule: game.startedAt, duration } });
      scheduleGame(game._id, schedule, duration, game.noOfQuestion);
      gameIds.push(game._id.toString());

    }

  }

}, 20000);



class scheduleController {

  async Scheduler(req, res, next) {
    try {

      const games = await Game.find({ isCompleted: false });
      let setting = await Setting.findOne().lean();
      const { nextQuestionTiming, questionTiming } = setting;
      const tTime = (nextQuestionTiming + questionTiming) * 1000;

      for (const game of games) {
        console.log(new Date(game.schedule))

        if (!gameIds.includes(game._id.toString())) {
          console.log("+++++++++++++++++////////////////////")
          const schedule = game.startedAt;
          const duration = game.noOfQuestion * tTime;
          await Game.findOneAndUpdate({ _id: game._id }, { $set: { schedule: game.startedAt, duration } });
          scheduleGame(game._id, schedule, duration, game.noOfQuestion);
          gameIds.push(game._id.toString());
        }
      }

    } catch (err) {
      console.log(err);
    }
  }

}

module.exports = new scheduleController();


function scheduleGame(gameId, schedule, duration, noOfQuestion) {
  const t = schedule - Date.now();
  const _t = (duration / noOfQuestion);
  console.log(schedule > Date.now(), schedule, Date.now(), schedule - Date.now())
  setTimeout(() => {
    socket.emit('send_question', { gameId });
  }, t)

}
