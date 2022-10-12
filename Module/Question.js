const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    Question : String,
    a: String,
    b: String,
    c: String,
    d: String,
    anw: String

});

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;