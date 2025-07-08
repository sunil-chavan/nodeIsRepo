const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const tiffinRoutes = require("./routes/tiffinRoutes");
const tiffinCategoryRoutes = require('./routes/tiffinCategoryRoutes');
const { verifyToken } = require('./middleware/authMiddleware');
const userTiffinRoutes = require('./routes/userTiffinRoutes');




dotenv.config();

const app = express();

// Middleware
app.use(express.json());
// Apply token check to all APIs under /api (except login/register)


// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.use("/api/auth", authRoutes);
// ------------------------------
app.use('/api', verifyToken);
app.use("/api/users", userRoutes);
app.use('/api/tiffin', tiffinRoutes);
app.use('/api/tiffin-category', tiffinCategoryRoutes);
app.use('/api/usertiffin', userTiffinRoutes);




module.exports = app;
