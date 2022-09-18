const express = require('express');
const app = express();
const mongoClient = require('mongodb').MongoClient;
//const router = express.Router();
//const MyModel = require("../Models/MyModels");
const mongoose = require("mongoose");
//const PostModel = require("../Models/PostModel");

const url = "mongodb+srv://oenoen:just123@cluster0.jaoidri.mongodb.net/test"

app.use(express.json())

mongoClient.connect(url, (err, db) =>{
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false,
    // useCreateIndex: true
    if (err) {
      console.log("Error while connecting mongo client")
    }else {
      const myDb = db.db('database')
      const collection = myDb.collection('Users')
      app.post('/signup', (req,res) =>{
        const newUser = {
          email: req.body.email,
          tenngdung: req.body.tenngdung,
          matkhau: req.body.matkhau
        }
        // const query = { email: newUser.email }
        const query = { email: newUser.email }
        collection.findOne(query, (err, result) => {
          if (result==null) {
            collection.insertOne(newUser, (err, result) =>{
              res.status(200).send()
            })
          }else {
            res.status(404).send()
          }
        })
      })
      app.post('/login', (req,res) =>{
        const query = {
          email: req.body.email,
          matkhau: req.body.matkhau
        }
        console.log(req.body.email);
        collection.findOne(query, (err, result) =>{
          if (result!=null) {
            const objToSend = {
              email : result.email,
              matkhau : result.matkhau
              //email: result.email
            }
            res.status(200).send(JSON.stringify(objToSend))
          } else {
            res.status(404).send()
          }
        })
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