const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const engine = require('ejs-locals')
const bodyParser = require('body-parser');
const morgan = require('morgan');
require('dotenv').config();
app.use(cors());
const mongoose = require('mongoose');
const async=require('async');
mongoose.set('debug', process.env.NODE_ENV === 'development');

app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'static')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// app.use('/public', express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.engine('ejs', engine)
app.set('view engine', 'ejs')

app.use((req, res, next) => {
  res.success = (data, message) => {
    // console.log(data)
    res.status(200).json({
      success: true,
      data,
      message,
    })
  }
  res.error = (data, message) => {
    // console.log(data)
    res.status(200).json({
      success: false,
      data,
      message,
    })
  }
  res.warn = (data, message) => {
    // console.log(data)
    res.status(200).json({
      success: false,
      data,
      message,
    })
  }
  next()
});

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customfavIcon: '/fav32.png',
    customSiteTitle: 'Quiz',
    authorizeBtn: false,
    swaggerOptions: {
      filter: true,
      displayRequestDuration: true,
    },
  }),
);

const port = process.env.PORT
const connectDB = require('./db/db');
app.use('/api', require('./routes/apiRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

const http = require('http');
server = http.createServer(app);
server.listen(port, () => console.log(`Server running on port ${port}`));
const io = require("socket.io")(server, {allowEIO3: true});
module.exports={io};

const ScheduleController = require('./controllers/scheduleController');
ScheduleController.Scheduler();



//-----------------------SOCKET IO------------------------------------------------




const { User ,Game ,UserGame ,UserQuestion,Question,Transaction, Wallet,Pool } = require('./db/models/User.model');
const Setting=require('./db/models/setting.model');

var gameArr=[]



io.on('connection', socket => {



  io.to(socket.id).emit('message', 'socket is connected');

  socket.on('joinGame', async (data, callback) => {
      let {gameId,userId} = data;
    if (gameId && userId) {
      [gameId, userId] = [gameId.toString(), userId.toString()]
      if (!findById(gameId, userId,socket.id)) {
        socket.join(gameId);
        gameArr.push({gameId, userId,socketId:socket.id});
      }

      
      io.to(socket.id).emit('get-joinGame', {isJoined: true});
    }
      
  });

  socket.on('send_question', async (data, callback) => {
      try {
     
        const settings=await Setting.findOne({});
        const { nextQuestionTiming,questionTiming}=settings;
        const tTime=(nextQuestionTiming+questionTiming)*1000;
        
     
         let {gameId} =data;
          let index=0;
        
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
            },
            {
              $unwind:"$Questions"
            },
            {
              $project:{
                QuestionH:"$Questions.questionInHindi",
                QuestionE:"$Questions.questionInEnglish",
                optionH:"$Questions.optionsInHindi", 
                optionE:"$Questions.optionsInEnglish",
                q_no:"$Questions.q_no",
                answer:"$Questions.answer",
                noOfQuestion:1,
                duration:1,
                schedule:1,
                questionId:"$Questions._id",
              }
            }
          ]);

          let _QuestionHindi=[];
          let _QuestionEnglish=[];
     

          for (let i = 0; i < game.length; i++) {
            _QuestionHindi.push({QuestionH:game[i].QuestionH,optionH:game[i].optionH,answer:game[i].answer,q_no:game[i].q_no,questionId:game[i].questionId});
            _QuestionEnglish.push({QuestionE:game[i].QuestionE,optionH:game[i].optionE,answer:game[i].answer,q_no:game[i].q_no,questionId:game[i].questionId})
            
          }


          const { duration,noOfQuestion,schedule}=game[0];
          const ttTime=tTime*noOfQuestion;
         

          const interval=(nextQuestionTiming+questionTiming)*1000;
          let QuestionEnglish = _QuestionEnglish[Number(index)];
          let QuestionHindi = _QuestionHindi[Number(index)];
          const nextquestSchedule = schedule+(index+1)*interval;

          socket.to(gameId).emit('get-question', {QuestionEnglish ,QuestionHindi, t:questionTiming, duration, noOfQuestion, interval: nextQuestionTiming,gameId,schedule,nextquestSchedule });
          index++;
           
           const ID=setInterval(() =>{
            
            if(index>=noOfQuestion){
              index=0;
              clearInterval(ID);
            }else{

              let QuestionEnglish=_QuestionEnglish[Number(index)];
              let QuestionHindi=_QuestionHindi[Number(index)];
              const nextquestSchedule = schedule+(index+1)*interval;
              index++;
              socket.to(gameId).emit('get-question', {QuestionEnglish ,QuestionHindi, t:questionTiming, duration, noOfQuestion, interval: nextQuestionTiming,gameId,schedule,nextquestSchedule });
            }
          
           },interval);
          
         

        setTimeout(async function () {

          var userGame = await UserGame.aggregate([
            {
              $match: {
                gameId: new mongoose.Types.ObjectId(gameId)
              }
            }
          ]);

          let questions_all = await Question.find({gameId});

          for (let i = 0; i < userGame.length; i++) {
            for(let question of questions_all) {
             
                let user_q=await UserQuestion.findOne({gameId:gameId, questionId:question._id,userId:userGame[i].userId}).lean();
                if(!user_q){
                
                  
                  user_q=new UserQuestion({
                    gameId:gameId,
                    userId:userGame[i].userId,
                    questionId:question._id,
                    rawPoints:0,
                    mainPoints:0,
                    question:question.questionInEnglish,
                    q_no:question.q_no,
                    answer:5
                  });
                  await user_q.save();
                }
            }
          }

          for (let i = 0; i < userGame.length; i++) {
            let userQuestions = await UserQuestion.find({ gameId: userGame[i].gameId, userId: userGame[i].userId }).lean();
            
            let totalRawPoints = userQuestions.reduce((a, b) => a + b.rawPoints, 0);
            let totalMainPoints = userQuestions.reduce((a, b) => a + b.mainPoints, 0);
            
            let user_game=await UserGame.findOne({ _id: userGame[i]._id });
            user_game.rawPoints = totalRawPoints;
            user_game.mainPoints=totalMainPoints;
            await user_game.save();
            


        }

          const { pool } = await Pool.findOne({ gameId });
          if (userGame.length > 0) {

            userGame.sort(function (a, b) {

              if (b.mainPoints < a.mainPoints) {
                return -1;
              } else if (b.mainPoints > a.mainPoints) {
                return 1;
              } else {
                if (a.joinedAt < b.joinedAt) {
                  return -1;
                } else if (a.joinedAt > b.joinedAt) {
                  return 1;
                } else {
                  return 0;
                }
              }
            });

            const transactions = [];
            for (let i = 0; i < userGame.length; i++) {
              const user = userGame[i];
  
              user.rank=(i+1);
              await UserGame.findByIdAndUpdate({_id:user._id},{$set:{rank:user.rank}});
              const reward = pool.find(poolItem => user.rank >= poolItem.from && user.rank <= poolItem.to);
              user.wonAmount = reward?.amount ? reward?.amount : 0;
              if (reward) {
                let user_game=await UserGame.findOne({_id:user._id});
                user_game.rank = (i+1);
                user_game.wonAmount = user.wonAmount;
                await user_game.save();
                transactions.push({ userId: user.userId, gameId: user.gameId, amount: reward.amount, msg: 'Game Won', type: 2, status: 1 });


              }
            }

            await Transaction.insertMany(transactions);

            for(let t of transactions){
         

              let wallet = await Wallet.findOne({userId: new mongoose.Types.ObjectId(t.userId)});
              wallet.balance=wallet.balance+t.amount;
              wallet.winBalance=wallet.winBalance+t.amount;
              await wallet.save();
           
              

            }
            await Game.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(gameId) }, { $set: { isCompleted: true,status:2 } });
            await UserGame.updateMany({ gameId: new mongoose.Types.ObjectId(gameId) }, { $set: { isCompleted: true } });


          }

        }, ttTime + 60000);


       

      



      } catch (err) {
          console.log(err);
      }
  });

  socket.on('wantQuestions', async (data, callback) => {
    try {


       let {gameId} =data;
        let q_no=0;
      
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
        
        io.to(socket.id).emit('get-question', { Questions,t,duration,noOfQuestion,interval:5000 });
        
    } catch (err) {
        console.log(err);
    }
});

  socket.on('get_result', async (data, callback) => {
      try {

          let questionId = data.questionId;
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
  
            io.to(socket.id).emit('get_result_on', {data: question});

          }else{
            io.to(socket.id).emit('get_result_on', {data: {}});
          }

         
          
          // return callback({ data: question });

      } catch (err) {
          console.log(err);
      }
  });

  socket.on('give_answer', async (data, callback) => {
    try {

        let { questionId,gameId,question,timeTaken,q_no,q_time,schedule,answer,rawPoints,rM,rC,type,userId}=data;
        console.log("questionId",questionId,"gameId",gameId,"question",question,"timeTaken",timeTaken,"q_no",q_no,"q_time",q_time,"schedule",schedule,answer,rawPoints,rM,rC,type,userId,"=============>>>>>GIVE_ANSWER")
        let t_rem=(schedule+(q_no+1)*q_time*1000)-Date.now()+3000;
        if(t_rem>0){
          io.to(socket.id).emit('give_answer_on', {status:false});
        }
        const _question=await Question.findOne({_id:new mongoose.Types.ObjectId(questionId)});
        if(_question){

          
         // console.log(t_rem,"======------------------------=======t_rem=========-------->>>>>>>>>>>>");
          let c_userQuestion_no = await UserQuestion.countDocuments({ gameId,questionId,isCorrect:true });
          let t_userQuestion_no=await UserGame.countDocuments({ gameId });
          setTimeout(async function(){
            const settings=await Setting.findOne({});
            const { rightQuestionMarks, wrongQuestionMarks}=settings;
            const mM=_question.answer==answer?rightQuestionMarks:wrongQuestionMarks;

            
            let isCorrect = _question.answer === answer;
            c_userQuestion_no = isCorrect ? c_userQuestion_no + 1 : 0;
            console.log(t_userQuestion_no, c_userQuestion_no);

            let prnt=((c_userQuestion_no)/t_userQuestion_no)*100;
            const mC = prnt <= 10 ? 0
              : prnt <= 20 ? 1
                : prnt <= 30 ? 2
                  : prnt <= 40 ? 3
                    : prnt <= 50 ? 4
                      : prnt <= 60 ? 5
                        : prnt <= 70 ? 6
                          : prnt <= 80 ? 7
                            : prnt <= 90 ? 8
                              : 9;

            const t_MPoints=calculate(calculate(mM,mC),timeTaken)
            rawPoints=calculate((rM+timeTaken),rC);
            let rMrC=calculate(rM,rC);


          //  console.log(t_MPoints,t_MPoints,"-------------------------======UUUUUUUUUU========------------>")
            const t_m_Points=calculate(mC,timeTaken);

            const mainPoints=t_MPoints+t_m_Points;
    
            const userQuestion=new UserQuestion({
              gameId,
              question,
              userId,
              questionId,
              timeTaken,
              answer,
              q_no,
              mainPoints,
              rawPoints,
              t_MPoints,
              t_m_Points,
              isCorrect,
              rM,
              rC,
              mM,
              mC,
              rMrC,
              type
            });
    
            await userQuestion.save();
            _question.questAttempted+=1;
            await UserGame.findOneAndUpdate({userId,gameId},{$set:{$inc:{mainPoints,rawPoints }}})
            await _question.save();
  
          },t_rem)
          io.to(socket.id).emit('give_answer_on', {status:true});
        //  return callback({ data: userQuestion });

        }else{
          io.to(socket.id).emit('give_answer_on', {status:false});
        }
      

    } catch (err) {
        console.log(err);
    }
});

});

function findById(gameId,userId,socketId) {
  const flag=gameArr.find(obj => (obj.gameId === gameId)&&(obj.userId === userId)&&(obj.socketId==socketId))
  return flag;
}




function calculate(num1, num2) {
  const result = num1 + num2;
  
  if (result > 9.5) {
    
    const [integerPart, decimalPart] = result.toString().split('.');
    const integerSum = integerPart.split('').map(Number).reduce((acc, digit) => acc + digit, 0);
    const decimalSum = decimalPart ? decimalPart.split('').map(Number).reduce((acc, digit) => acc + digit, 0) / 10 : 0;

    const sum = integerSum + decimalSum;
    if (sum > 9.5) {
      return calculate(sum, 0);
    }

    if (sum === 9.5) {
      return sum;
    }
    return sum;
  }
 return result;
}

