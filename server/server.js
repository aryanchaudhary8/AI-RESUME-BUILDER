import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js'
import userRoutes from './routes/userRoutes.js';
import resumeRouter from './routes/resumeRouter.js';
import aiRouter from './routes/aiRoutes.js';

await connectDB();

const app = express()
const port = process.env.PORT || 3000 ;

app.use(express.json())
app.use(cors())

app.get('/', (req,res) => {
    res.send("Server is live")
})

app.use('/api/users',userRoutes)
app.use('/api/resumes',resumeRouter)
app.use('/api/ai',aiRouter)

app.listen(port,()=> {
    console.log(`server is running at this port no: ${port}`)
})