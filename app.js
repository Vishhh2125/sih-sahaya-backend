import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
dotenv.config();


const app = express();

app.use(morgan('dev'));                        // Logs requests
app.use(express.json());                       // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static("public"));             // Serve static files
app.use(cookieParser());                       // Parse cookies
app.use(cors({ origin: "http://localhost:5173", credentials: true }));                // Allow cross-origin requests







// routes


import userRouter from './routes/user.routes.js'
import registrationRouter from './routes/registration.routes.js'
import collegeRouter from './routes/college.routes.js'
import collegeAdminRouter from './routes/collegeAdmin.routes.js'
import appointmentRouter from './routes/appointment.routes.js'
import peerRouter from './routes/peer.routes.js'
import counselorRouter from './routes/counselor.routes.js'








app.use("/api/v1/users", userRouter)
app.use("/api/v1/registration", registrationRouter)
app.use("/api/v1/colleges", collegeRouter)
app.use("/api/v1/college-admins", collegeAdminRouter)
app.use("/api/v1/appointments", appointmentRouter)
app.use("/api/v1/peers", peerRouter)
app.use("/api/v1/counselors", counselorRouter)






















export {app};