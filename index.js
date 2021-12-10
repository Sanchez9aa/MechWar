const express = require("express")
const dotenv = require('dotenv')
const radarRouter = require('./routes/radar')
const getHello = require("./routes/hello")

const app = express()
dotenv.config()
PORT = process.env.PORT

//middlewares
app.use(express.json())

//routes
app.use("/radar", radarRouter)
app.use("/", getHello)



app.listen(PORT || 8801, () => {
  console.log(`Listen on port ${PORT || 8801}`)
})