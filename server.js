const express = require('express');
const { ObjectId } = require('mongodb');
const app = express();
const mongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require("nodemailer");
const dontenv= require("dotenv")
dontenv.config();
const { json } = require('express');
const cloudinary= require("cloudinary").v2
const multer = require("multer")
const path = require("path")

cloudinary.config({
  cloud_name: 'dcllp2b8r',
  api_key: '786475196392548',
  api_secret: '0FHkZlrgOAFGqcOk1mhKwi5oYbI'
})


const filestore= multer.diskStorage({
  
  fileFilter: (req, file, cb)=>{
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== "/jpeg" && ext !== ".png"){
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
})

const upload= multer({ storage: filestore})





//const PostModel = require("../Models/PostModel");
//const router = express.Router();
//const MyModel = require("../Models/MyModels");

//const url = "mongodb+srv://oenoen:just123@cluster0.jaoidri.mongodb.net/test"
const url ="mongodb+srv://admin:admin@cluster0.mxicf65.mongodb.net/da"
app.use(express.json())

mongoClient.connect(url, (err, db) =>{
    if (err) {
      console.log("Error while connecting mongo client")
    }else {

      // Đăng ký
      app.post('/signup', (req,res) =>{
        const myDb = db.db('test')
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
        const myDb = db.db('test')
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

      // Post bo đề
      app.post('/list', (req,res) =>{
        const myDb = db.db('da')
       
        collection = myDb.collection(req.body.sub)
          collection.find({},{ projection: { _id: 0, Code: 1 } }).toArray(function(err, result) {
          if (result!=null) {
            res.status(200).send(JSON.stringify(result))
          } else {
            res.status(404).send()
            console.log("die")
          }
          })

      })

      // post câu hỏi
      app.post('/ques', (req,res) =>{
        const myDb = db.db('da')
        const query = {Code: req.body.Code}

        function fond(col1,col2)
        {
          collection = myDb.collection(col1)
          //collection.find(query,{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{
            collection.findOne(query,async(err, result) =>{
              if (result!=null) {
                collection = myDb.collection(col2)
                
                 let obj = new Array()
                 for(i=0;i<result.Questions.length;i++)
                 {
                  const ques = {_id: result.Questions[i]}
                  var found = await collection.findOne(ques)
                  obj.push(found)
                 }
                res.status(200).send(obj)
                    
              } else {
                res.status(404).send()
                console.log("die1")
              }
            }) 
        }

        if(req.body.sub=="Eng_exam"||req.body.sub=="Eng_review")
        {
          
          col2="English"
          fond(req.body.sub, col2)
        }

        else if(req.body.sub=="His_exam"||req.body.sub=="His_review")
        {
          col2="History"
          fond(req.body.sub, col2)
        }
        
        else if(req.body.sub=="Geo_exam"||req.body.sub=="Geo_review")
        {
          
          col2="Geography"
          fond(req.body.sub, col2)
        }
        
        else if(req.body.sub=="Gdcd_exam"||req.body.sub=="Gdcd_review")
        {
          col2="Gdcd"
          fond(req.body.sub, col2)
        }              
        
        

      })
      
      // Gửi OTP
      app.post('/sendOTP', function(req, res) {
        const myDb = db.db('test')
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
                html: `<p>Mã OTP của bạn là: <b>${otp}</b></p>
                        <p>Mã sẽ hết hiệu lực sau 5 phút.</p>`,
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
            } else if (result==null){
              res.status(400).send()
              //khong tim thay tk
            } else res.status(404).send()

          })
        
      });

      // Xác nhận OTP
      app.post('/verifyOTP', function(req, res){
        const myDb = db.db('test')
        const collection = myDb.collection('Users')

        
        const query = { email: req.body.email}
        console.log(req.body)
        const otp=  req.body.otp
        
        collection.findOne(query, (err,result)=>{
          if (result!=null){
            if(result.expiresAt<Date.now()){
              //timeout
              res.status(201).send()
            } else{
              if (bcrypt.compareSync(otp, result.otp)){
                res.status(200).send()
                console.log("done")
                const deleteOTP= { $set:{ otp: ""}}
                collection.updateOne(query, deleteOTP, function(err, res){
                  if (err) throw err;
                })
              }
              else res.status(202).send()
              //sai otp 
            }
          }
          else if (result==null)res.status(400).send()
          //không tìm thấy tk
          else res.status(404).send()
        })

      });

      // Đổi mật khẩu
      app.post('/changepass', function(req,res){
        const myDb = db.db('test')
        const collection = myDb.collection('Users')

        const query = { email: req.body.email }
        collection.findOne(query, (err, result) => {
           if (result!=null) {
              const newpass= { $set:{ matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds)}}
              collection.updateOne(query, newpass, function(err, result){
              if (!err) res.status(200).send();
            })
            } else if (result==null){
              res.status(400).send()
              //khong tim thay tk
            } else res.status(404).send()

          })
      })

      // Đổi thông tin user
      app.post('/changeinfo', function(req,res){
        const myDb = db.db('test')
        const collection = myDb.collection('Users')

        const query = { email: req.body.email }

        collection.findOne(query, (err, result) => {
           if (result!=null) {
              if (req.body.matkhau!=""){
                newinfo= { $set:{ tenngdung: req.body.tenngdung, matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds) }}
                console.log("!null")
              }
              else if (req.body.matkhau=="") {
                newinfo= { $set:{ tenngdung: req.body.tenngdung}}
                console.log("null")
              }
              collection.updateOne(query, newinfo, function(err, result){
              if (!err) res.status(200).send();
              })
            } else if (result==null)
            {
              res.status(400).send()
              //khong tim thay tk
            } else res.status(404).send()

          })
      })

      // Upload ảnh
      app.post('/uploadimg',upload.single('image'), async function(req,res){
         const upImg = await cloudinary.uploader.upload(req.file.path) //up anh len cloudinary
        
         const myDb = db.db('test')
         const collection = myDb.collection('Users')
         // up anh len mongo
         const ava= { $set:{avatar: upImg.url, cloudinary_id: upImg.public_id}}
         const query = { email: req.body.email }
         collection.findOne(query, async (err, result) => {
            if (result!=null) {
              if(result.avatar != "")
              {
                await cloudinary.uploader.destroy(result.cloudinary_id)
              }
                collection.updateOne(query, ava, function(err, result){
                  if (!err) res.status(200).send();
                })
             } 
             else if (result==null){
               res.status(400).send()
             } 
             else res.status(404).send()
 
           })
         
      })



      
      

      
    }
    
});


const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log("Listening on port: ",port)
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


