const express = require('express');
const { ObjectId } = require('mongodb');
const app = express();
const mongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");
//const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const saltRounds = 10;


//const PostModel = require("../Models/PostModel");
//const router = express.Router();
//const MyModel = require("../Models/MyModels");

const url = "mongodb+srv://oenoen:just123@cluster0.jaoidri.mongodb.net/test"

app.use(express.json())

mongoClient.connect(url, (err, db) =>{
    if (err) {
      console.log("Error while connecting mongo client")
    }else {

      app.post('/signup', (req,res) =>{
        const myDb = db.db('database')
        const collection = myDb.collection('Users')

        const newUser = {
          email: req.body.email,
          tenngdung: req.body.tenngdung,
          matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds)
        }

        const query = { email: newUser.email }
        collection.findOne(query, (err, result) => {
          if (result==null) {
            collection.insertOne(newUser, (err, result) =>{
              res.status(200).send()
            })
          }
          else if (query==result) {
            res.status(201).send()
            //Đã có email trên db

          }else {
            res.status(404).send()
          }

        })
      })

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