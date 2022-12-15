const express = require('express');
const { ObjectId } = require('mongodb');
const app = express();
const mongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require("nodemailer");
// const dontenv= require("dotenv")
// dontenv.config();
const { json } = require('express');
const cloudinary= require("cloudinary").v2
const multer = require("multer")
const path = require("path");
const { type } = require('os');


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

const url = "mongodb+srv://oenoen:oenoen@dacn.kxrrsop.mongodb.net/test"
//const url ="mongodb+srv://admin:admin@cluster0.mxicf65.mongodb.net/da"
app.use(express.json())

mongoClient.connect(url, (err, db) =>{
    if (err) {
      console.log("Error while connecting mongo client")
    }else {
      // Đăng ký
      app.get('/', (req,res) =>{
        res.status(200).send("Hello")
      })

      app.post('/signup', (req,res) =>{
        const myDb = db.db('test')
        const collection = myDb.collection('Users')

        const newUser = {
          email: req.body.email,
          tenngdung: req.body.tenngdung,
          matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds),
          otp: "",
          createAt: Date.now(),
          expiresAt: Date.now(),
          avatar: "http://res.cloudinary.com/dcllp2b8r/image/upload/v1669049364/galqynrofgin4x6cyxsq.jpg",
          cloudinary_id: "galqynrofgin4x6cyxsq"
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
                tenngdung : result.tenngdung,
                avatar : result.avatar
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

        function ran(obj)
        {
          sourceArray=["a", "b", "c", "d"]
          for (var i = 0; i < sourceArray.length - 1; i++) {
            var j = i + Math.floor(Math.random() * (sourceArray.length - i));
    
            var temp = sourceArray[j];
            sourceArray[j] = sourceArray[i];
            sourceArray[i] = temp;
          }
          obj1 = { a: "", b: "", c: "", d: ""}
          for (var i = 0; i < sourceArray.length ; i++) {
            obj1[sourceArray[i]] = obj[sourceArray[i]]
          }
          obj.a=obj1[sourceArray[0]]
          obj.b=obj1[sourceArray[1]]
          obj.c=obj1[sourceArray[2]]
          obj.d=obj1[sourceArray[3]]
          return obj
        }

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
                  console.log(ques)
                  var found = await collection.findOne(ques)
                  obj.push(ran(found))
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
      app.post('/uploadimg', upload.single('image'), async (req,res)=>{
        if (req.body.image != "")
        {
          var upImg = await cloudinary.uploader.upload(req.file.path) //up anh len cloudinary
        
        
          const myDb = db.db('test')
          const collection = myDb.collection('Users')
          // up anh len mongo
          const ava= { $set:{avatar: upImg.url, cloudinary_id: upImg.public_id}}
          const query = { email: req.body.email }
          collection.findOne(query, async (err, result) => {
            if (result!=null) {
              if(result.avatar != "" && result.cloudinary_id != "galqynrofgin4x6cyxsq")
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

        }
        else res.status(404).send("Không có ảnh")
        
        
     })

     app.post('/changeinfo2', upload.single('image'), async (req,res)=>{
      try{
        const myDb = db.db('test')
        const collection = myDb.collection('Users')

        
        const query = { email: req.body.email }
        await collection.findOne(query, async (err, result) => {
          
          if (result!=null) {
            let temp=0
            //nếu có mk
            if (req.body.matkhau!=""){
              newinfo= { $set:{ tenngdung: req.body.tenngdung, matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds) }}
                collection.updateOne(query, newinfo, function(err, result)
                {
                  if (result!=null) temp+=4;
                  console.log("mk ten")
                })
            }
            //nếu không có mk
            else if (req.body.matkhau=="") {
              newinfo= { $set:{ tenngdung: req.body.tenngdung}}
                collection.updateOne(query, newinfo, function(err, result)
                {
                  if (result!=null) temp+=2;
                  console.log("ten")
                })
            }

            //nếu có ảnh
            if (req.body.image != "")
            {
              var upImg = await cloudinary.uploader.upload(req.file.path) //up anh len cloudinary
              const ava= { $set:{avatar: upImg.url, cloudinary_id: upImg.public_id}}
              await collection.updateOne(query, ava, function(err, result)
              {
                if (result!="") temp+=1;
                console.log("hinh")
              })
              if(result.avatar != "" && result.cloudinary_id != "galqynrofgin4x6cyxsq")
              {
                await cloudinary.uploader.destroy(result.cloudinary_id)
              }
            }  
            
            const resul= collection.findOne(query, (err, resul) => {
              const objToSend = {
                email : resul.email,
                tenngdung : resul.tenngdung,
                avatar : resul.avatar
              }       
              console.log(temp)
              switch(temp){
                case 5:  //cập nhật tất cả
                  res.status(200).send(JSON.stringify(objToSend));
                  break;
                case 4:   //cập nhật tên, mk
                  res.status(201).send(JSON.stringify(objToSend));
                  break;
                case 3:   //cập nhật tên, hinh
                  res.status(202).send(JSON.stringify(objToSend));
                  break;
                case 2:    //cập nhật tên
                  res.status(203).send(JSON.stringify(objToSend));
                  break;
                default:
                  res.status(203).send(JSON.stringify(objToSend));
                  break;
              }
            })

          } else if (result==null){
            res.status(400).send()
            //khong tim thay tk
          } else res.status(404).send()
        })

      }
      catch(err)
      {
        console.log(err)
        throw(err)
      }
      
    })

      app.get('/search', async (req,res)=>{
        const myDb = db.db('da')
        const collection = myDb.collection(req.body.sub)   
        var collection1, collection2
             
        if(req.body.sub=="English")
        {
          collection1 = myDb.collection('Eng_exam')
          collection2 = myDb.collection('Eng_review')
        }
        else if(req.body.sub=="History")
        {
          collection1 = myDb.collection('His_exam')
          collection2 = myDb.collection('His_review')
        }
        else if(req.body.sub=="Geography")
        {
          collection1 = myDb.collection('Geo_exam')
          collection2 = myDb.collection('Geo_review')
        }
        else if(req.body.sub=="Gdcd")
        {
          collection1 = myDb.collection('Gdcd_exam')
          collection2 = myDb.collection('Gdcd_review')
        }   

        var query = {
          "$or":[
            {Question:{ $regex: '.*' + req.body.search + '.*'}},
            {a:{ $regex: '.*' + req.body.search + '.*'}},
            {b:{ $regex: '.*' + req.body.search + '.*'}},
            {c:{ $regex: '.*' + req.body.search + '.*'}},
            {d:{ $regex: '.*' + req.body.search + '.*'}},
          ]
        }
        collection.find(query).toArray(async function(err,result){
          if (err) throw err;
          else{
            let obj = new Array()
            for( let i=0; i<result.length;i++ )
            {
              const ques = {Questions: result[i]._id}
              const send ={
                Question: result[i].Question,
                anw: result[i].anw
              }

              var result1 = await collection1.findOne(ques)
              if (result1!=null){
                Object.assign(send,{Code: result1.Code, Sub: collection1.collectionName})
                obj.push(send)
              }

              var result2 = await collection2.findOne(ques)
              if (result2!=null){
                Object.assign(send,{Code: result2.Code, Sub: collection2.collectionName})
                obj.push(send)
              }
            }    
            res.status(200).send(obj)           
          }
        })
      })

      app.get('/searchid', async(req,res)=>{
        
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


