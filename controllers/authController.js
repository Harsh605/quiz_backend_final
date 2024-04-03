const jwt = require('jsonwebtoken')
const { signJWT, verifyJWT } = require('./utils')
const { generateOtp, randomString, utcDateTime } = require('../lib/util')
const mongoose = require('mongoose')
const { User, Wallet, Address,Transaction } = require('../db/models/User.model');
const Setting = require('../db/models/setting.model');

var request = require('request');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');


class AuthController {

    async logIn(req, res, next) {
        try {
            const { password, email } = req.body;

                const user = await User.findOne({ email });

                if (!user) {
                    return res.status(404).json({ message : 'Not found' });
                }

                if (!user.status) {
                    return res.status(404).json({ message : 'Not verified' });
                }

                const passwordMatch = bcrypt.compareSync(password, user.password);

                if (!passwordMatch) {
                    return res.status(404).json({ message : 'Check password and phone' });
                }


                user.authTokenIssuedAt = utcDateTime().valueOf();
                await user.save();
                const userJson = user.toJSON();
                const jwttoken = signJWT(userJson);

                delete userJson.password;
                delete userJson.authTokenIssuedAt;
                delete userJson.otp;
                delete userJson.resetToken;
                delete userJson.__v;

                userJson.jwt = jwttoken;
                return res.success({ user: userJson }, 'Login Success');


        } catch (err) {
            console.log(err);
            return next(err);
        }
    }
    


    
  async generateToken(req, res) {
      let _id = req.params._id;
      const user = await User.findOne({ _id });
      const platform = req.headers['x-hrms-platform'];
      const token = signJWT(user, platform);
      return res.success({
          token
      });
  }
  async logOut(req, res) {
     
      const { user } = req;
      user.authTokenIssuedAt = null;
      user.deviceToken = null;
      await user.save();
      return res.success({}, 'LOGOUT_SUCCESS');
  }
  /**
   * 
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns 
   */
  async verifyOtp(req, res, next) {
      const {otp, email, resetToken,TYPE } = req.body;

      try {

          let user = await User.findOne({email, status: true})

          if (!user) {
            return res.status(401).json({message :"UNAUTHORIZED"});
          } else {
              if (user.resetToken == resetToken) {
                  if ((user.otp == otp)) {
                    let setting = await Setting.findOne().lean()
                    const ref_amount=setting.referralPoints?setting.referralPoints:0;
                    if(!user.isVerified&&user.refferBy&&ref_amount>0){

                        //const 
                        const refUser=await User.findOne({id:user.refferBy});
                        let _txn = new Transaction({
                            userId: refUser._id,
                            refUserId:req._id,
                            amount:ref_amount,
                            msg: 'Referral reward',
                            type: 6,
                            status: true
                          });
                          const txn = await _txn.save();

                       let wallet = await Wallet.findOne({userId:refUser._id});
                       wallet.ref_amount=wallet.ref_amount+ref_amount;
                       wallet.balance=wallet.balance+ref_amount;
                       await wallet.save();
                       
                  }
                      user.isVerified = true;
                      user.authTokenIssuedAt = utcDateTime().valueOf();
                      let newUser = await user.save();
                      const userJson = newUser.toJSON();
                      const jwttoken = signJWT(user);
                      userJson.jwt = jwttoken;

                      

                      ['password', 'authTokenIssuedAt', 'otp', 'resetToken', '__v'].forEach(key => delete userJson[key]);
                      return res.success({user: userJson,TYPE },'OTP verified');

                  } else {
                    return res.status(401).json({message :'Invalid OTP'});
                  }

              } else {
                  return res.status(401).json({message :"Invalid reset token"});
              }
          }
      } catch (err) {
          return next(err)
      }
  }

  async resendOtp(req, res, next) {
      const { email, resetToken} = req.body;
      try {
          let user = await User.findOne({email, status: true});

          if (!user) { return res.status(401).json({message :"UNAUTHORIZED"});}
          if (user) {
              if (user.resetToken === resetToken) {
                //   let otp = generateOtp();
                  user.otp = '1234';
                  await user.save();
                  return res.success({resetToken,email}, "OTP sent successfully");

              } else {
                return res.status(401).json({message :"Invalid reset token"});
              }

          }
      } catch (err) {
        console.log(err);
          return next(err)
      }
  }
  /**
   * 
   * @param {email,password,deviceToken,deviceType} req 
   * @param {*} res 
   * @param {*} next 
   */

async  register(req, res, next) {
    const { email, name } = req.body;

    try {
        // Check if the user already exists
        let user = await User.findOne({ email });

        if (user) {
            if (!user.isVerified) {

                if(password==confirm_password){
                // const otp = generateOtp();
                const hashedPassword = await bcrypt.hash(password, 10);

                // Update user data
                user.email = email;
                user.name = name;
                user.password = hashedPassword;
                user.otp = otp;
                const resetToken = randomString(12);
                user.resetToken = resetToken;
                user.isVerified = false;
            user.authTokenIssuedAt = utcDateTime().valueOf();


                await user.save();

                const options = {
                    url: process.env.FAST_URL,
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        authorization: process.env.FAST_KEY
                    },
                    body: {
                        // variables_values: otp,
                        route: 'otp',
                       // numbers: mobile
                    },
                    json: true
                };

                // Parallelize sending OTP and processing the response
                const [userUpdateResult] = await Promise.all([
                   // sendOTP(options),
                    user.save()
                ]);

                const userJson = userUpdateResult.toJSON();
                ['password', 'authTokenIssuedAt', 'otp', 'resetToken', '__v'].forEach(key => delete userJson[key]);
                return res.success({
                    resetToken,
                    user: userJson,
                }, "Please verify OTP to complete registration");

            }else{
                return res.status(500).json({
                    success: false,
                    message : 'password and confirm password does not match'
                });

            }
            } else {
                return res.status(500).json({
                    success: false,
                    message : 'Account already registered'
                });
            }
        } else {
            // Create a new user
            // const otp = generateOtp();
            const resetToken = randomString(12);

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                email,
                name,
                
                resetToken,
                isVerified: false
            });
            newUser.authTokenIssuedAt = utcDateTime().valueOf();

            await newUser.save();

            const options = {
                url: process.env.FAST_URL,
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization: process.env.FAST_KEY
                },
                body: {
                    // variables_values: otp,
                    route: 'otp',
                   // numbers: mobile
                },
                json: true
            };

            // Parallelize sending OTP and processing the response
            const [ newUserResult] = await Promise.all([
                //sendOTP(options),
                newUser.save()
            ]);

            const userJson = newUserResult.toJSON();
            ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v','resetToken'].forEach(key => delete userJson[key]);
            return res.success({resetToken,  user: userJson }, "Please verify OTP to complete registration");
        }
    } catch (err) {
        console.error(err);
        return next(err);
    }
}


async  signup(req, res, next) {
    const { name,email,mobile,password,confirm_password,referCode } = req.body;
    try {

        if(name &&email&&mobile&&password&&confirm_password){

            let user = await User.findOne({email});

            if (user) {
                if (!user.isVerified) {
                    const hashedPassword = await bcrypt.hash(password, 10);
    
                    user.name = name;
                    user.email = email;
                    user.mobile = mobile;
                     user.password = hashedPassword;
                    // user.otp = otp;
                    const resetToken = randomString(12);
                    user.resetToken = resetToken;
                    user.isVerified = false;
                    user.refferBy=referCode;
                    user.authTokenIssuedAt = utcDateTime().valueOf();
    
    
                    await user.save();
    
                    const options = {
                        url: process.env.FAST_URL,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json',
                            authorization: process.env.FAST_KEY
                        },
                        body: {
                            // variables_values: otp,
                            route: 'otp',
                           // numbers: mobile
                        },
                        json: true
                    };
    
                    // Parallelize sending OTP and processing the response
                    const [userUpdateResult] = await Promise.all([
                       // sendOTP(options),
                        user.save()
                    ]);
    
                    const userJson = userUpdateResult.toJSON();
                    ['password', 'authTokenIssuedAt', 'otp', 'resetToken', '__v'].forEach(key => delete userJson[key]);
                    return res.success({
                        resetToken,
                        user: userJson,
                    }, "Please verify OTP to complete registration");
                }else {
                    return res.status(500).json({
                        success: false,
                        message : 'Account already registered'
                    });
                }
                
            } else {
                // Create a new user
                // const otp = generateOtp();
                
                const resetToken = randomString(12);
                const newUser = new User()
                console.log(password,"/////",confirm_password,password==confirm_password);
                if(password==confirm_password){
    
    
               const hashedPassword = await bcrypt.hash(password, 10);

                    const uniqueId = uuid.v4();
                    const id = 'PD'+uniqueId.slice(0, 8).replace('-', '');
                    newUser['id'] = id.toUpperCase();
    
                newUser.name=name,
                newUser.email=email,            
                newUser.mobile=mobile,
                newUser.password=hashedPassword,
                newUser.resetToken=resetToken
                newUser.isVerified=false
                newUser.refferBy=referCode;
                    
                    
                
                newUser.authTokenIssuedAt = utcDateTime().valueOf();
                const [ newUserResult] = await Promise.all([
                    //sendOTP(options),
                    newUser.save()
                ]);
    
                const wallet= new Wallet({
                    userId: newUserResult._id
                });
                await wallet.save();
                
                const userJson = newUserResult.toJSON();
                ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v','resetToken'].forEach(key => delete userJson[key]);
                return res.success({resetToken,  user: userJson }, "Please verify OTP to complete registration");
                }else{
                    return res.status(500).json({
                        success: false,
                        message : 'Password and confirm password does not match'
                    });
    
                }
            }



        }else{
            return res.status(500).json({
                success: false,
                message : 'Something went wrong'
            });
        }
    
    } catch (err) {
        console.error(err);
        return next(err);
    }
}

  async  forgotPassword(req, res, next) {
    const { email } = req.body;
    try {
        const user = await User.findOne({email,status: true});

        if (!user) {
            return res.status(401).json({message :"Not registered"});
        } else if (user) {
            const resetToken = randomString(10);
            // const otp = generateOtp();

            user.resetToken = resetToken;
            // user.otp = otp;
            user.authTokenIssuedAt = utcDateTime().valueOf();
            await user.save();

            const options = {
                url: process.env.FAST_URL,
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization: process.env.FAST_KEY
                },
                body: {
                    variables_values: user.otp,
                    route: 'otp',
                   // numbers: mobile
                },
                json: true
            };

            //const result = await sendOTP(options);
            return res.success({ resetToken,email }, "OTP sent successfully");
        }
    } catch (err) {
        return next(err);
    }
}

async resetPassword(req, res, next) {
    const { password, cnfpassword } = req.body;

    try {
        const { _id } = req;
        const user = await User.findOne({ _id });

        if (!user) {
            return res.status(401).json({ message : "UNAUTHORIZED" });
        }

        if (password === cnfpassword) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();
            return res.success({}, 'Password reset successfully');
        } else {
            return res.status(401).json({ message : "Passwords do not match" });
        }
    } catch (err) {
        return next(err);
    }
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
          resolve( (body) );
        }
      }
    });
  });

}
