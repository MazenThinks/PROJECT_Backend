const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'Name is required'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            unique: true,
            lowercase: true,
        },
        phone: String,
        profileImg: String,

        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            trim: true
        },
        dob: {
            type: Date,
            trim: true
        },
        age: {
            type: Number,
            min: [0, 'Age cannot be negative']
        },
        address: {
            type: String,
            trim: true
        },

        password: {
         type: String,
         required: function () {
           return !this.firebaseUid;
         },
          minlength: [6, 'Too short password'],
         },

        passwordChangedAt: Date,
        passwordResetCode: String,
        passwordResetExpires: Date,
        passwordResetVerified: Boolean,
         firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },

        role: {
            type: String,
            enum: ['admin','manager', 'user'],
            default: 'user',
        },
        active: {
            type: Boolean,
            default: true,
        },
        // child references (one to many)
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        addresses: [
            {
            id: { type: mongoose.Schema.Types.ObjectId },
            alias: String,
            details: String,
            phone: String,
            city: String,
            postalCode: String,
            },
        ],
    },
{timeseries: true}
);

userSchema.pre('save', async function (next){
    if (!this.isModified('password')) return next();
//Hashing user password
this.password = await bcrypt.hash(this.password, 12);
next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;