const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    tenngdung: String,
    email: String,
    matkhau: String

});

const User = mongoose.model('User', UserSchema);

module.exports = User;