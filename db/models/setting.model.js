const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function getImage(image) {
    console.log('image', image)
    if(image) {
        return process.env.BASE_URL + image
    } else {
        return ''
    }
}

const SettingSchema = new Schema({
    logo: { type: String, default: '' },
    ad1: { type: String, default: '' },
    ad2: { type: String, default: '' },
    ad3: { type: String, default: '' },
    ad4: { type: String, default: '' },
    whatsappLink: { type: String, default: '' },
    telegramLink: { type: String, default: '' },
    youtubeLink: { type: String, default: '' },
    email: { type: String, default: '' },
    playVideoLink: { type: String, default: '' },
    playImageLink: { type: String, default: '' },
    playText: { type: String, default: '' },
    aboutUs: { type: String, default: '' },
    termsAndCondition: { type: String, default: '' },
    privacyPolicy: { type: String, default: '' },
    refundCancellation: { type: String, default: '' },
    quizTiming: { type: Number, default: 0 },
    questionTiming: { type: Number, default: 0 },
    nextQuestionTiming: { type: Number, default: 0 },
    rightQuestionMarks: { type: Number, default: 0 },
    wrongQuestionMarks: { type: Number, default: 0 },
    quizInstruction: { type: String, default: '' },
    referralPoints: { type: Number, default: 0 },
    minimumWithdraw: { type: Number, default: 0 },
    withdrawCommission: { type: Number, default: 0 },
    playStoreLink: { type: String, default: '' },
    status: { type: Boolean, default: true }
},
    {
        timestamps: true,
        toJSON: true
    });

const Setting = mongoose.model('Setting', SettingSchema);



module.exports = Setting;
