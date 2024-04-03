const jwt = require('jsonwebtoken')
const { User } = require('./../db/models/User.model')
const Admin = require('./../db/models/admin.model')

const signJWT = (user) => {
  const payload = {
    sub: user._id,
    role: user.role,
    iat: user.authTokenIssuedAt,
    mobile: user.mobile
  }
  return jwt.sign(payload, process.env.JWT_SECRET)
}

const verifyJWT = (req, res, next) => {

  if (req.headers['authorization']) {
    jwt.verify(req.headers['authorization'], process.env.JWT_SECRET, async (err, decoded) => {

      if (err || !decoded || !decoded.sub) {
        return res.status(401).send('Unauthorized');
      }
      // console.log(decoded);
      if (decoded.role === 'Admin') {
        const user = await Admin.findOne({
          _id: decoded.sub,
          status: true,
          // mobile: decoded.mobile
        });

        if (!user) {
          return res.send({
            success: "deactivated",
            status: "deactivated",
            message: 'UNAUTHORIZED'
          });
        }

        req._id = user['_id'];
        req.role = user['role'];
        req.user = user;
        req.token = true;
        next();
      } else {
        const user = await User.findOne({
          _id: decoded.sub,
          status: true,
          mobile: decoded.mobile
        });

        if (!user) {
          return res.send({
            success: "deactivated",
            status: "deactivated",
            message: 'UNAUTHORIZED'
          });
        }

        if (user.isSuspended) {
          return res.send({
            success: "deactivated",
            status: "deactivated",
            message: "Admin has deactivated your account"
          });
        }
        req._id = user['_id'];
        req.role = user['role'];
        req.user = user;
        req.token = true;
        next();
      }


    });
  }


}

module.exports = { signJWT, verifyJWT }
