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

const AdminSchema = new Schema({
    name: { type: String, required: true, index: true },
    mobile: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    role: { type: String, default: 'Admin', index: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '', get: getImage },
    permission: { type: Array, default: [] },
    authTokenIssuedAt: Number,
    otp: { type: String, default: '1234' },
    isVerified: { type: Boolean, default: true },
    status: { type: Boolean, default: true }
},
    {
        timestamps: true,
        toJSON: true
    });

const Admin = mongoose.model('Admin', AdminSchema);



module.exports = Admin;
