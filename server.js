const config = global.config = require('./config.js');

const express = require('express');
const app = express();

const bParser = require("body-parser");
const cParser = require("cookie-parser");
const ejs = require("ejs");
const path = require("path");

const session = require('express-session');
const mongoose = require('mongoose');


app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
app.use(bParser.json());
app.use(bParser.urlencoded({ extended: true }));
app.use(cParser());
app.set('views', path.join(__dirname, 'src/views'));
app.use(express.static(path.join(__dirname, 'src/public')));
app.use(session({ secret: 'basic-login', resave: false, saveUninitialized: true }));


mongoose.connect(config.db, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => { if (err) console.log(err); console.log("MongoDB Bağlandı"); });

app.get('/', async (req, res) => {
    if (req.session.loggedin) {
        res.render('index')
    } else {
        res.render('login')
    }
})

app.get('/register', async (req, res) => {
    if (req.session.loggedin) {
        res.render('index')
    } else {
        res.render('register')
    }
})

app.post("/userlogin", async (req, res) => {
    const { veriData } = require("./src/database/schema")
    const data = await veriData.findOne({ userEmail: req.body.email })
    let err_msg = "";
    if (data) {
        if (req.body.email !== data.userEmail) {
            err_msg = "Email is wrong!";
            res.render('login', { err_msg: err_msg })
        } else if (req.body.password !== data.userPassword) {
            err_msg = "Password is wrong!"
            res.render('login', { err_msg: err_msg })
        } else {
            req.session.loggedin = true;
            req.session.useremail = data.userEmail;
            req.session.username = data.userName;
            res.render('index', { user: req.session.username })
        }
    } else {
        err_msg = "There is no such account!"
        res.render('login', { err_msg: err_msg })
    }
})

app.post("/create", async (req, res) => {
    let err_msg = '';
    let tr_msg = '';
    const { veriData } = require("./src/database/schema")
    const data = await veriData.find({})
    if (data) {
        data.map(async a => {
            if (req.body.email == a.userEmail) {
                err_msg = 'Email already exists!'
                res.render('register', { err_msg: err_msg })
            } else if (req.body.username == a.userName) {
                err_msg = 'Username already exists!'
                res.render('register', { err_msg: err_msg })
            } else {
                console.log("data içerisinde kayıt deniyorum")
                await veriData.findOneAndUpdate({ userName: req.body.username }, { $set: { userName: req.body.username, userEmail: req.body.email, userPassword: req.body.password } }, { upsert: true }).exec();
                tr_msg = 'Registration completed!';
                res.render('login', { tr_msg: tr_msg })
            }
        })
    } else {
        await veriData.findOneAndUpdate({ userName: req.body.username }, { $set: { userName: req.body.username, userEmail: req.body.email, userPassword: req.body.password } }, { upsert: true }).exec();
        tr_msg = 'Registration completed!';
        res.render('login', { tr_msg: tr_msg })
    }
})

app.post("/logout", async (req, res) => {
    req.session.loggedin = false;
    req.session.username = '';
    res.render('login')
})

app.post("/deleteaccount", async (req, res) => {
    let tr_msg = '';
    const { veriData } = require("./src/database/schema")
    await veriData.deleteMany({ userName: req.session.username })
    tr_msg = 'Account deleted successfully!'
    res.render('login', { tr_msg: tr_msg })
})
app.listen(config.port, () => console.log(`${config.name} is running on port ${config.port}`));
