import express from "express"
import dotenv from "dotenv"
import cors from "cors";
import db from "./utils/db.js"
// import all routes
import userRoutes from "./routes/user.routes.js"
import cookieParser from "cookie-parser";

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors({
    origin: 'https://localhost/3000',  // we can insert multiple value using array 
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('Cohort!')
})

app.get('/hitesh', (req, res) => {
    res.send("Hitesh!")
})

app.get('/piyush', (req, res) => {
    res.send("Piysh!")
})

// connect to db
db()

// user routes
app.use("/api/v1/users", userRoutes)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})