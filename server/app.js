require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const session = require("express-session");

const multer = require("multer");
const specificFilePath = "uploads/";
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb+srv://strokeicons:6omWkzyJ070GCKTQ@cluster0.z4rko.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;

// Define User schema and model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  username: String,
  role: {
    type: String,
    default: "user",
  },
});

const User = mongoose.model("User", userSchema);

// Define File schema and model
const fileSchema = new mongoose.Schema({
  filename: String,
  filepath: String,
  title: String,
  downloadCount: { type: Number, default: 0 },
  approved: { type: Boolean, default: false },
  pending: { type: Boolean, default: true },
  uploadedBy: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const File = mongoose.model("upload", fileSchema);

//Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `file-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueFileName);
    req.uniqueFileName = uniqueFileName;
  },
});

const upload = multer({ storage });

// Express session
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "$2b$10$x2w8uKPCaXkY1smr2gZyYu",
    resave: false,
    saveUninitialized: true,
  })
);

// Serving uploaded files
app.use("/uploads", express.static("uploads"));

// Serving static files and controllers
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/controllers",
  express.static(path.join(__dirname, "public", "controllers"))
);

app.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@thomsonreuters.com")) {
      return res.status(401).json({ success: false, message: "Invalid email" });
    }

    //find the user by email
    let user = await User.findOne({ email: normalizedEmail });

    // If the user doesn't exist, create a new user
    if (!user) {
      const newUser = new User({
        email: normalizedEmail,
        role: "user",
      });

      user = await newUser.save();
    }

    req.session.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
      username: extractUsernameFromEmail(user.email),
    };

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction failed:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    res.json({ success: true, message: "Logout successful" });
  });
});

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // User is authenticated
    if (!req.session.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Extracting title and filename from the form data
    const title = req.body.title;
    const originalFilename = req.file.originalname;

    // Extract username from the user session
    const username = req.session.user.username;

    // SpecificFilePath instead of req.file.path
    const filePath = specificFilePath + req.uniqueFileName;

    // Saving file information to MongoDB with the provided title, original filename, and specific file path
    const newFile = new File({
      filename: originalFilename,
      filepath: filePath,
      title: title,
      uploadedBy: username, // Use the extracted username as uploadedBy
      approved: false,
    });

    await newFile.save();
    console.log("File data saved to MongoDB:", newFile);
    res.json({
      success: true,
      message: `File '${originalFilename}' uploaded successfully!`,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      message: `Error uploading file: ${error.message}`,
    });
  }
});

// Middleware to check if a user is an admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Unauthorized access" });
  }
};

// Delete Route
app.delete("/icons/:iconId", isAdmin, async (req, res) => {
  try {
    const iconId = req.params.iconId;
    const result = await File.deleteOne({ _id: iconId });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: "Icon deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Icon not found." });
    }
  } catch (error) {
    console.error("Error deleting icon:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Download Route
app.get("/download/:iconId", async (req, res) => {
  try {
    const iconId = req.params.iconId;
    const result = await File.findByIdAndUpdate(
      iconId,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (result) {
      res.json({
        success: true,
        message: "Download count incremented successfully.",
      });
    } else {
      res.status(404).json({ success: false, message: "Icon not found." });
    }
  } catch (error) {
    console.error("Error incrementing download count:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Approve route
app.patch("/approve-icon/:iconId", async (req, res) => {
  try {
    const iconId = req.params.iconId;
    const result = await File.findOneAndUpdate(
      { _id: iconId, approved: false },
      { $set: { approved: true, approvedBy: req.session.user._id } },
      { new: true }
    );

    if (result) {
      res.json({ success: true, message: "Icon approved successfully." });
    } else {
      res.status(404).json({
        success: false,
        message: "Icon not found or already approved.",
      });
    }
  } catch (error) {
    console.error("Error approving icon:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/files", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;

    let query = {};
    const approvalStatus = req.query.approvalStatus;
    const searchTerm = req.query.searchTerm;

    if (approvalStatus) {
      query.approved = approvalStatus === "approved";
    }

    // Check if there is a search term or filter
    if (searchTerm || approvalStatus) {
      const files = await File.find(query).populate("uploadedBy", "username");
      res.json(files);
    } else {
      const skip = (page - 1) * pageSize;
      const files = await File.find(query)
        .skip(skip)
        .limit(pageSize)
        .populate("uploadedBy", "username");
      res.json(files);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/files/count", async (req, res) => {
  try {
    const totalCount = await File.countDocuments({});
    res.json(totalCount);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.term.toLowerCase();

    // Query the database for files matching the search term in title or uploadedBy
    const searchResults = await File.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { "uploadedBy.username": { $regex: searchTerm, $options: "i" } },
      ],
    });

    res.json(searchResults);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/files/search/count", async (req, res) => {
  try {
    const searchTerm = req.query.term.toLowerCase();

    // Count documents based on the search term using the File model
    const count = await File.countDocuments({
      title: { $regex: searchTerm, $options: "i" },
    });

    res.json(count);
  } catch (error) {
    console.error("Error counting search results:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Pending Icons
app.get("/pending-files", async (req, res) => {
  try {
    // Fetch only pending icons
    const pendingFiles = await File.find({ pending: true }).populate(
      "uploadedBy",
      "username"
    );
    res.json(pendingFiles);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/icons", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  res.sendFile(path.join(__dirname, "/public/views", "icons.html"));
});

// User info
app.get("/get-user-info", (req, res) => {
  if (req.session.user) {
    const { username, role } = req.session.user;
    const timeOfDay = getTimeOfDay();
    res.json({ success: true, username, role, timeOfDay });
  } else {
    res.json({
      success: false,
      username: null,
      role: null,
      timeOfDay: "Unknown",
    });
  }
});

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 18) {
    return "afternoon";
  } else {
    return "evening";
  }
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Function to extract username from email
function extractUsernameFromEmail(email) {
  const username = email.split("@")[0];
  return username;
}
