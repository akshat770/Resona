const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.create({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// NOTE: We do NOT use serialize/deserialize for sessions in JWT flow,
// but keeping these won't hurt if some libs expect them.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id).then(u => done(null, u)).catch(err => done(err, null));
});

module.exports = passport;
