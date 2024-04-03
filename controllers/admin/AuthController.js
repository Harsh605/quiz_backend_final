const jwt = require('jsonwebtoken')
const { signJWT, verifyJWT } = require('../utils')
const { generateOtp, randomString, utcDateTime } = require('../../lib/util')
const mongoose = require('mongoose')
const Admin = require('../../db/models/admin.model')
var request = require('request');
const bcrypt = require('bcryptjs');
const { User } = require('../../db/models/User.model')


class AuthController {

    async logIn(req, res, next) {
        try {
            const { password, email } = req.body;

            let user = await Admin.findOne({ email }).lean();


            if (!user) {
                return res.error({}, 'Not found.')
                // return res.status(404).json({ msg: 'Not found' });
            }

            if (!user.status) {
                return res.error({}, 'Not verified.')
                // return res.status(404).json({ msg: 'Not verified' });
            }

            const passwordMatch = bcrypt.compareSync(password, user.password);
            console.log("========================>",passwordMatch)

            if (!passwordMatch) {
                // return res.error({}, 'Invalid password.')
                return res.status(401).json({ msg: 'Check password and phone' });
            }


            await Admin.findOneAndUpdate({ _id: user._id }, { $set: { authTokenIssuedAt: utcDateTime().valueOf() } }, { new: true })

            user.authTokenIssuedAt = utcDateTime().valueOf();
            user.avatar = process.env.BASE_URL + user.avatar
            console.log("========================>")

            // await user.save();
            const jwttoken = signJWT(user);

            delete user.password;
            delete user.authTokenIssuedAt;
            delete user.otp;
            delete user.__v;

            user.jwt = jwttoken;
            console.log("user", user)
            return res.success({ user: user }, 'Login Success');


        } catch (err) {
            console.log(err)
            return next(err);
        }
    }

    async forgotPassword(req, res, next) {
        const { email } = req.body;
        try {
            let user = await Admin.findOne({ email: email, status: true });

            if (!user) { return res.error({}, "Admin not found"); }
            if (user) {
                await Admin.updateOne({
                    email: email,
                    status: true
                }, {
                    $set: {
                        otp: '1234'
                    }
                })

                return res.success({}, "Otp sent successfully.");



            }
        } catch (err) {
            return next(err)
        }
    }

    async verifyOtp(req, res, next) {
        const { otp, email } = req.body;
        try {

            let user = await Admin.findOne({
                email, status: true
            })

            if (!user) {
                return res.error({}, "UNAUTHORIZED");
            } else {
                if ((user.otp == otp)) {
                    await Admin.updateOne({
                        _id: user._id,
                        email
                    }, {
                        $set: {
                            otp: null
                        }
                    });

                    return res.success({}, 'OTP verified');
                } else {
                    return res.error({}, 'Invalid OTP');
                }
            }
        } catch (err) {
            return next(err)
        }
    }

    async updatePassword(req, res, next) {
        const { email, password } = req.body;
        try {
            let user = await Admin.findOne({ email: email, status: true });

            if (!user) { return res.error({}, "Admin not found"); }
            if (user) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await Admin.updateOne({
                    email: email,
                    status: true
                }, {
                    $set: {
                        otp: null,
                        password: hashedPassword
                    }
                })

                return res.success({}, "Password changed successfully.");



            }
        } catch (err) {
            return next(err)
        }
    }

    async adminCreate(req, res) {
        let { name, email, mobile, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const emailExist = await Admin.findOne({ email });
        if (emailExist) return res.error({}, 'Email already exist.');

        const mobileExist = await Admin.findOne({ mobile });
        if (mobileExist) return res.error({}, 'Mobile already exist.');

        await Admin.create({
            name,
            email,
            password: hashedPassword,
            mobile
        })
        return res.success({}, 'Admin create successfully.');
    }

    async me(req, res, next) {
        try {
            const adminExist = await Admin.findOne({
                // email: req.user.email,
                _id: req.user._id
            }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 })
            if (adminExist) {
                adminExist.avatar = process.env.BASE_URL + adminExist.avatar
                return res.success({ ...adminExist._doc }, 'Get Detail.');
            } else {
                return res.error({}, 'Something went wrong.')
            }

        } catch (err) {
            return next(err);
        }
    }

    async changeAdminPassword(req, res, next) {
        const { currentPassword, cPassword } = req.body;
        try {
            let user = await Admin.findOne({ _id: req.user._id, status: true });

            if (!user) { return res.error({}, "Admin not found"); }
            if (user) {
                const passwordMatch = bcrypt.compareSync(currentPassword, user.password);

                if (!passwordMatch) {
                    return res.error({}, 'Old Password does not match.');
                }

                const hashedPassword = await bcrypt.hash(cPassword, 10);

                await Admin.updateOne({
                    _id: req.user._id
                }, {
                    $set: {
                        password: hashedPassword
                    }
                })

                return res.success({}, "Password changed successfully.");
            }
        } catch (err) {
            return next(err)
        }
    }

    async logOut(req, res) {

        const { user } = req;
        user.authTokenIssuedAt = null;
        user.deviceToken = null;
        await user.save();
        return res.success({}, req.__('LOGOUT_SUCCESS'));
    }


}

module.exports = new AuthController()


function sendOTP(options) {

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                console.error('Error occurred while calling the API:', error.message);
                reject(error);
            } else {
                if (response.statusCode === 503) {
                    resolve({ status: false });
                } else {
                    resolve((body));
                }
            }
        });
    });

}
