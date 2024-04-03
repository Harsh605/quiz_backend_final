const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, index: true },
  id: { type: String, default: '' },
  mobile: { type: String, required: true, index: true },
  email: { type: String, index: true },
  role: { type: String, default: 'USER', index: true },
  password: { type: String },
  avatar: { type: String, default: '' },
  otp: { type: String, default: '1234' },
  resetToken: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  // loc: {type: { type: String, default: 'Point' },coordinates: [ { type: Number,},],},
  deviceType: { type: String, default: '', },
  deviceToken: { type: String, default: '', },
  deviceId: { type: String, default: '', },
  refferBy: { type: String, required: false },
  refferCode: { type: String, required: false },
  refferedTo: [{ type: String }],
  street_address: { type: String, default: '', },
  city: { type: String, default: '', },
  state: { type: String, default: '', },
  country: { type: String, default: '', },
  pincode: { type: String, default: '', },
  notification: { type: Boolean, default: true, },
  authTokenIssuedAt: Number,
  status: { type: Boolean, default: true },
  kyc: { type: Number, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },

});

const walletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  balance: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  winBalance: { type: Number, default: 0 },
  withdraw: { type: Number, default: 0 },
  holdBalance: { type: Number, default: 0 },
  discount_bonus: { type: Number, default: 0 },
  ref_amount: { type: Number, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});



const gameSchema = new Schema({
  gameNameInHindi: { type: String, required: true },
  gameNameInEnglish: { type: String, required: true },
  category: { type: String, default: '' },
  startedAt: { type: Number },
  endedAt: { type: Number },
  entranceAmount: { type: Number, required: true }, // entry amount per user
  noOfQuestion: { type: Number, required: true }, // no of question in this game
  noOfParticipation: { type: Number, required: true }, // how many user will join
  noOfPrice: { type: Number, required: true }, // How many user will award
  pricePool: { type: Number, required: true }, // Game price 
  joinedMember: { type: Number, default: 0 },
  isCompleted: { type: Boolean, required: false },
  schedule: { type: Number },
  duration: { type: Number, default: 900000 },
  businessDate: { type: Number },
  status: { type: Number, default: 0 }, // 0-> Upcoming, 1-> Live, 2-> Completed
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});


const userGameSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  gameNameInHindi: { type: String, required: true },
  gameNameInEnglish: { type: String, required: true },
  // questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
  status: { type: Number, default: 0 }, // 0-> Game Lose, 1-> Game Win
  mainPoints: { type: Number, default: 0 },
  rawPoints: { type: Number, default: 0 },
  rank: { type: Number, default: 1 },
  isCompleted: { type: Boolean, default: false },
  amount: { type: Number },
  questAttempted: { type: Number, default: 0 },
  schedule: { type: Number },
  businessDate: { type: Number },
  wonAmount: { type: Number },
  type: { type: String, default: 'ENGLISH' },
  joinedAt: { type: Number }
});

const kycSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  adhaar: { type: Number },
  pan: { type: String },
  adhaarFront: { type: String },
  adhaarBack: { type: String },
  panFront: { type: String },
  panBack: { type: String },
  isVerified: { type: Boolean, default: false },
  time: { type: Number },
  remark: { type: String },
  status: { type: Number, default: 0 }
});


const questionSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
  questionInEnglish: { type: String, required: true },
  questionInHindi: { type: String, required: true },
  optionsInEnglish: [{ id: { type: Number }, answer: { type: String } }],
  optionsInHindi: [{ id: { type: Number }, answer: { type: String } }],
  answer: { type: Number, required: true },
  q_no: { type: Number, default: 1 },
  createdAt: { type: Number, default: Date.now() }
});

const userQuestionSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: String, required: true },
  q_no: { type: Number, required: true},
  answer: { type: Number,  },
  isCorrect: { type: Boolean, default: false },
  mainPoints: { type: Number, default: 0 },
  rawPoints: { type: Number, default: 0 },
  rM: { type: Number, default: 0 },
  rC: { type: Number, default: 0 },
  mM: { type: Number, default: 0 },
  mC: { type: Number, default: 0 },
  rMrC: { type: Number, default: 0 },
  t_MPoints:{ type: Number, default: 0 },
  t_m_Points:{ type: Number, default: 0 },
  rank: { type: Number, default: 1 },
  type: { type: String },
  timeTaken: { type: Number },
  createdAt: { type: Number, default: Date.now() },
  isCompleted: { type: Boolean, default: false },
});


const bankSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bank_name: { type: String, required: true },
  account_holder: { type: String, required: true },
  account_number: { type: String, required: true },
  ifsc: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});


const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  isAdmin: { type: Boolean },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});


const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: Number, default: 0, required: true }, //0=deposit,1=game ded,2=game won,3=withd,4=pen,5=refund,6=ref,7=bonus
  status: { type: Number, default: 0, required: true }, // 0 pending, 1 success, 2 reject
  msg: { type: String, default: '' },
  rz_order_id: { type: String, default: '' },
  refUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  amount: { type: Number, default: 0, required: true },
  withDamount:{ type: Number, default: 0, required: true },
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', index: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});



const PoolSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game' },
  pool: [{ _id: false, from: { type: Number, default: 1 }, to: { type: Number, default: 1 }, amount: { type: Number, default: 100 } }],
});

const FaqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date,  default: Date.now },
  updatedAt: { type: Date,  default: Date.now }
});


const slideSchema = new Schema({
  name: { type: String, required: true },
  slide: { type: String },
  isDeleted: { type: Boolean, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});

const socialLinkSchema = new Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  isDeleted: { type: Boolean, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});




walletSchema.index({ _id: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const Game = mongoose.model('Game', gameSchema);
const Question = mongoose.model('Question', questionSchema);
const Bank = mongoose.model('Bank', bankSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const UserGame = mongoose.model('UserGame', userGameSchema);
const UserQuestion = mongoose.model('UserQuestion', userQuestionSchema);
const Pool = mongoose.model('Pool', PoolSchema);
const Kyc = mongoose.model('Kyc', kycSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Slide = mongoose.model('Slide', slideSchema);
const SocialLink = mongoose.model('SocialLink', socialLinkSchema);
const Faqs = mongoose.model('Faq', FaqSchema);




module.exports = { User, Wallet, Game, Bank, Question, Transaction, UserGame, UserQuestion, Pool, Kyc, Notification, Slide, SocialLink, Faqs };
