const express = require('express');
const { default: mongoose } = require('mongoose');
const app = express();
const port = 8080;

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs')


// Set up mongoose connection
mongoose.set("strictQuery", false);

// Define the database URL to connect to
const devDBUrl = "mongodb+srv://ginapertance:fOyzpR8GnAaBKMbg@cluster0.tn5m5sr.mongodb.net/?retryWrites=true&w=majority";
const mongoDB = process.env.MONGO_URL || devDBUrl; 

main().catch((err)=>console.log(err));
async function main(){
  await mongoose.connect(mongoDB);
} 

app.use('/', indexRouter);
app.use('/catalog', caralogRouter);

app.listen(port, () => {
  console.log(`App listening at port ${port}`)
})