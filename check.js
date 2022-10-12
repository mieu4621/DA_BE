const express = require('express');
const { ObjectId } = require('mongodb');
const app = express();
const mongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");
//const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require("nodemailer");


//const PostModel = require("../Models/PostModel");
//const router = express.Router();
//const MyModel = require("../Models/MyModels");

const url = "mongodb+srv://oenoen:just123@cluster0.jaoidri.mongodb.net/test"
//const url ="mongodb+srv://admin:admin@cluster0.mxicf65.mongodb.net/da"
app.use(express.json())

mongoClient.connect(url, (err, db) =>{
    if (err) {
      console.log("Error while connecting mongo client")
    }else {
      // Đăng ký
      app.post('/signup', (req,res) =>{
        const myDb = db.db('database')
        const collection = myDb.collection('Users')

        const newUser = {
          email: req.body.email,
          tenngdung: req.body.tenngdung,
          matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds),
          otp: "",
          createAt: Date.now(),
          expiresAt: Date.now()
        }

        const query = { email: newUser.email }
        collection.findOne(query, (err, result) => {
          if (result==null) {
            collection.insertOne(newUser, (err, result) =>{
              res.status(200).send()
            })
          }
          else if (query.email==result.email) {
            res.status(201).send()
            //Đã có email trên db

          }else {
            res.status(404).send()
          }

        })
      })

      // Đăng nhập
      app.post('/login', (req,res) =>{
        const myDb = db.db('database')
        const collection = myDb.collection('Users')
        const query = {email: req.body.email}
        const matkhau = req.body.matkhau

        collection.findOne(query, (err, result) =>{
          if (result!=null) {
            if (bcrypt.compareSync(matkhau, result.matkhau))
            {
              const objToSend = {
                email : result.email,
                tenngdung : result.tenngdung
              }
              res.status(200).send(JSON.stringify(objToSend))
            }
            else {
              res.status(402).send()
              //Sai mật khẩu
            }
          } else if (result==null) {
            res.status(401).send()
              //Sai email
          } else {
            res.status(404).send()
          }
        })
      })

      // Lấy câu hỏi
      app.get('/ques', (req,res) =>{
        const myDb = db.db('database')
        const collection = myDb.collection('listCauHoi')
        collection.find().toArray((err, result) =>{
        //collection.findOne( (err, result) =>{
            if (result!=null) {
              console.log(result.length)
              // const objToSend = {
              //   result
              //   // _id: result._id,
              //   // Question : result.Question,
              //   // a: result.a,
              //   // b: result.b,
              //   // c: result.c,
              //   // d: result.d,
              //   // anw: result.Answer
              // }
              res.status(200).send(JSON.stringify(result))
            } else {
              res.status(404).send()
            }
          })          
        
          /*collection.find(function(err, result) {
            if (result!=null) {
              const objToSend = {
                _id: result._id,
                Question : result.Question,
                Answer: result.Answer
              }
              res.status(200).send(JSON.stringify(objToSend))
            } else {
              res.status(404).send()
            }
          }).toArray;*/
      })

      // // GET đề theo yêu cầu
      app.get('/list', (req,res) =>{
        const myDb = db.db('database')
        
        if(req.body.sub=="eng")
        {
          collection = myDb.collection('Eng_Exam')
        }else if(req.body.sub=="his")
        {
          collection = myDb.collection('His_Exam')
        }else if(req.body.sub=="geo")
        {
          collection = myDb.collection('Geo_Exam')
        }else if(req.body.sub=="gdcd")
        {
          collection = myDb.collection('GDCD_Exam')
        }
        // const myDb = db.db('da')
        // const collection = myDb.collection('Eng_Exam')
              
        const query = {Code: req.body.Code}
        collection.find(query,{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{
        //collection.findOne(query, {projection: { _id: 0, Questions: 1 }} , (err, result) =>{
        //collection.findOne({query},{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{
            if (result!=null) {
              res.status(200).send(JSON.stringify(result))
            } else {
              res.status(404).send()
            }
          }) 

      })
      
      // Gửi OTP
      app.post('/sendOTP', function(req, res) {
        const myDb = db.db('database')
        const collection = myDb.collection('Users')
       
        const query = { email: req.body.email }
        collection.findOne(query, (err, result) => {
           if (result!=null) {
              var transporter =  nodemailer.createTransport({ // config mail server
              service: 'Gmail',
              auth: {
                user: 'kaitothompson273@gmail.com',
                pass: 'splupebjgkienvib'
              }
              });
              const otp = `${Math.floor(1000+ Math.random() * 9000)}`;
              var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
                from: 'App',
                to: result.email,
                subject: 'Xác thực OTP',
                html: `<p>Mã OTP của bạn là: <b>${otp}</b></p>`,
              }
              transporter.sendMail(mainOptions, function(err, info){
                if (err) {
                    console.log(err);
                } else {
                    res.status(200).send()
                    //gửi thành công
                    const userOTPverify={
                      $set: {
                        otp: bcrypt.hashSync(otp, saltRounds),
                        createAt: Date.now(),
                        expiresAt: Date.now()+300000 
                      }
                    };
                    collection.updateOne(query, userOTPverify, function(err, res){
                      if (err) throw err;
                    })
                }
              });
            }else {
              res.status(404).send()
              //khong tim thay tk
            } 

          })
        
      });

      // Xác nhận OTP
      app.get('/verifyOTP', function(req, res){
        const myDb = db.db('database')
        const collection = myDb.collection('Users')

        const query = { email: req.body.email}
        const otp=  req.body.otp
        console.log(otp)
        collection.findOne(query, (err,result)=>{
          if (result!=null){
            if(result.expiresAt<Date.now()){
              //timeout
              res.status(201).send()
            } else{
              if (bcrypt.compareSync(otp, result.otp)){
                res.status(200).send()
                const deleteOTP= { $set:{ otp: ""}}
                collection.updateOne(query, deleteOTP, function(err, res){
                  if (err) throw err;
                })
              }
              else res.status(202).send()
              //sai otp 
            }
          }
          else res.status(400).send()
          //không tìm thấy tk
        })

      });


      // GET toàn bộ đề
      // app.get('/list', (req,res) =>{
      //   const myDb = db.db('da')
      //   const collection = myDb.collection('Eng_Exam')

      //   console.log(JSON.stringify(req.body))

      //   if(req.body!="{}")
      //   {
      //     collection.find({},{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{
      //       //collection.find({}, {projection: { _id: 0, Questions: 1 }} , (err, result) =>{
      //           if (result!=null) {
      //             res.status(200).send(JSON.stringify(result))
                
      //           } else {
      //             res.status(404).send()
      //           }
      //         })  
      //   } else if(req.body!=null)
      //   {
      //     const query = {Code: req.body.Code}
      //     collection.findOne(query, {projection: { _id: 0, Questions: 1 }} , (err, result) =>{
      //   //collection.findOne({query},{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{
      //       if (result!=null) {
      //         res.status(200).send(JSON.stringify(result))
      //       } else {
      //         res.status(404).send()
      //       }
      //     })    
      //   } else {
      //     res.status(404).send()
      //   }       
      // })
      

      
    }
    
});


app.listen(3000, () => {
  console.log("Listening on port 3000")
})


//NGUYEN LAM

// const { Router } = require('express')
// const express = require('express')
// const PostModel = require('./Models/PostModel')
// //const app = express()
// const port = process.env.PORT || 3000

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })




// Router.post("/show-post", async (req, res) => {
//   var check = req.body["handle"]
//   if (check === "admin"){
//     var posts = await PostModel.find({}, { __v: 0, _id:0, });

//     res.json(posts);
//   }
// })

// Router.get("/show-post", async (req, res) => {
  
  
//     var posts = await PostModel.find({}, { __v: 0, _id:0, });

//     res.json(posts);
  
// })


// @GET("/ques")
// Call<Ques> getQues(@Body("Question") String Question
//                   @Body("Anwser") Array Answer
//                   @Body("_id") ObjectId _id);

// @GET("/ques")
// Call<Ques> getQues(@Body Map(ObjectId, String, Array) map)


