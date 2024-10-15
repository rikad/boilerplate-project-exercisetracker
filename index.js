const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) console.error('MONGO URI NOT SET')

mongoose.connect(MONGO_URI)
  .then(() => console.log('MONGO Connected!'));

// scheme
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: String,
});

const ExcerciseSchema = new Schema({
  user_id: Schema.ObjectId,
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model('users', UserSchema);
const Excercise = mongoose.model('excercises', ExcerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const user = await User.create({ username: req.body.username })
  res.json({ '_id': user._id, 'username': user.username })
});

app.get('/api/users', async (req, res) => {
  const user = await User.find({})
  const users = user.map((x) => { 
    return { '_id': x._id, 'username': x.username }
  })

  res.json(users)
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  const user_id = req.params._id
  const description = req.body.description
  const duration = parseInt(req.body.duration) || 0
  let date = new Date(req.body.date)

  if (date.toDateString() === 'Invalid Date') {
    date = new Date()
  }
  
  const user = await User.findById(user_id)
  const exercise = await Excercise.create({
    user_id, description, duration, date
  })

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  })
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id
  const from = req.query.from
  const to = req.query.to
  const limit = req.query.limit


  const user = await User.findById(id)
  let exercises

  if (from && to) {
    exercises = Excercise.find({ 
      user_id: id,
      date: { $gte: new Date(from), $lte: new Date(to) }
    }).limit(limit)
  } else {
    exercises = Excercise.find({ user_id: id})
  }

  if (limit) exercises = exercises.limit(limit)

  exercises = await exercises

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map((x) => {
      return { description: x.description, duration: x.duration, date: x.date.toDateString()}
    })
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
