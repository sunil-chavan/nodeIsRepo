const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const tiffinRoutes = require("./routes/tiffinRoutes");
const tiffinCategoryRoutes = require('./routes/tiffinCategoryRoutes');
const { verifyToken } = require('./middleware/authMiddleware');
const tiffinSubcriptionRoutes = require('./routes/tiffinSubcriptionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();

const app = express();
app.use(cors({origin: true, credentials: true}));

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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use('/api/tiffin', tiffinRoutes);
app.use('/api/tiffin-category', tiffinCategoryRoutes);
app.use('/api/tiffin-subscription', tiffinSubcriptionRoutes);
app.use('/api/inventory', inventoryRoutes);





module.exports = app;
