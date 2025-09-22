import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
dotenv.config();


const  app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(cookieParser())






// routes


import userRouter from './routes/user.routes.js'
import registrationRouter from './routes/registration.routes.js'
import collegeRouter from './routes/college.routes.js'
import collegeAdminRouter from './routes/collegeAdmin.routes.js'
import appointmentRouter from './routes/appointment.routes.js'
import peerRouter from './routes/peer.routes.js'








app.use("/api/v1/users", userRouter)
app.use("/api/v1/registration", registrationRouter)
app.use("/api/v1/colleges", collegeRouter)
app.use("/api/v1/college-admins", collegeAdminRouter)
app.use("/api/v1/appointments", appointmentRouter)
app.use("/api/v1/peers", peerRouter)






















export {app};