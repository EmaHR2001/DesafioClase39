const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const gitHubStrategy = require('passport-github2').Strategy
const User = require('../dao/mongo/models/users.model')
const Service = require('../dao/mongo/services/cart.services')
const { createHash, isValidPass } = require('../utils/bcrypt')
const { githubClientId, githubSecret, githubCallBack } = require('../config/env.config')
const logger = require('../config/logger.config');
const fetch = require('node-fetch')
const cartService = new Service()

const initializePassport = () => {

    passport.use('login-passport',
        new LocalStrategy(
            { passReqToCallback: true, usernameField: 'email' },
            async (req, username, password, done) => {
                try {
                    let userFound = await User.findOne({ email: username })
                    if (!userFound) {
                        logger.info('User Not Found with username (email) ' + username);
                        return done(null, false);
                    }
                    if (!isValidPass(password, userFound.password)) {
                        logger.info('Invalid Password');
                        return done(null, false);
                    }

                    return done(null, userFound);
                }
                catch (err) {
                    return done(err);
                }
            })
    ),
        passport.use('register-passport',
            new LocalStrategy(
                { passReqToCallback: true, usernameField: 'email' },
                async (req, username, password, done) => {
                    try {
                        let data = {}
                        let newCart = await cartService.postCart(data)

                        let userData = req.body
                        let userFound = await User.findOne({ email: username })
                        if (userFound) {
                            logger.info('User already exists')
                            done(null, false)
                        }
                        let userNew = {
                            first_name: userData.first_name,
                            last_name: userData.last_name || 'no-last-name',
                            email: userData.email,
                            age: userData.age || 25,
                            password: createHash(userData.password),
                            rol: 'User',
                            cart: { _id: newCart._id }
                        }
                        let result = await User.create(userNew)
                        done(null, result)
                    }
                    catch (err) {
                        return done('Error creating user' + err)
                    }
                })
        ),
        passport.use('auth-github', new gitHubStrategy(
            {
                clientID: 'a3cde9aa35b565bcd7d5',
                clientSecret: '149eb634fd0a894d1486453f1f6578e97b50219d',
                callbackURL: 'http://localhost:8080/auth/github/callback'
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const res = await fetch('https://api.github.com/user/emails', {
                        headers: {
                            Accept: 'application/vnd.github+json',
                            Authorization: 'Bearer ' + accessToken,
                            'X-Github-Api-Version': '2022-11-28',
                        },
                    });

                    const emails = await res.json();
                    const emailDetail = emails.find((email) => email.verified == true);

                    if (!emailDetail) {
                        return done(new Error('cannot get a valid email for this user'));
                    }

                    let data = {}
                    let newCart = await cartService.postCart(data)
                    profile.email = emailDetail.email;
                    let user = await User.findOne({ email: profile.email });

                    if (!user) {
                        const newUser = {
                            first_name: profile._json.name || profile._json.login || 'noname',
                            last_name: profile._json.name || profile._json.login || 'no-last-name',
                            email: profile.email,
                            age: 18,
                            password: createHash('123'),
                            rol: 'User',
                            cart: { _id: newCart._id }
                        };
                        let userCreated = await User.create(newUser);
                        logger.info('User Registration succesful');
                        return done(null, userCreated);
                    } else {
                        logger.info('User already exists');
                        logger.info('Esto client id es de github :' + githubClientId, ' secret git :' + githubSecret)
                        return done(null, user);
                    }
                }
                catch (err) {
                    logger.error('Error en auth github');
                    logger.error(err);
                    return done(err);
                }
            }
        )
        ),
        passport.serializeUser((user, done) => {
            done(null, user._id)
        }),
        passport.deserializeUser(async (id, done) => {
            let user = await User.findById(id)
            done(null, user)
        })
}

module.exports = initializePassport
