const jwt = require('jsonwebtoken');
const {
    models: { User },
} = require('../db/models');

const signToken = user => {
    const payload = {
        sub: user._id,
        iat: user.authTokenIssuedAt,
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
};

const verifyToken = (req, res, next) =>
    jwt.verify(req.session.token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err || !decoded || !decoded.sub) {
            req.session.user = null;
            req.session.token = null;
            //req.flash('error', req.__('UNAUTHORIZED'));
            return res.redirect('/registerPage');
        }

        const user = await User.findOne({
            _id: decoded.sub,
            isDeleted: false,
            authTokenIssuedAt: decoded.iat,
        });

        if (!user) {
            req.session.user = null;
            req.session.token = null;
            req.flash('error', req.__('UNAUTHORIZED'));
            return res.redirect('/registerPage');
        }

        // if (user.isSuspended) {
        //     req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
        //     return res.redirect('/auth/log-in');
        // }

        req.user = user;
        res.user._id = user._id;
        const userJson = user.toJSON();
        [ 'authTokenIssuedAt', '__v'].forEach(key => delete userJson[key]);
        req.session.user = userJson;
        next();
    });

module.exports = { signToken, verifyToken };