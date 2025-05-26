const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');
const MONGO_URL = 'mongodb://127.0.0.1:27017/myProject';

main().then(()=> {
    console.log("Connected to database");
}).catch((err) => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}


const initDB = async() => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({
        ...obj,owner : "682dfab2bcf2556c0a850b6a"
    }))
    await Listing.insertMany(initData.data);
    console.log("Database initialized");
}

initDB();