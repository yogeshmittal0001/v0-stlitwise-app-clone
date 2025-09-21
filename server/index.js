const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB connection with proper error handling
const connectDB = async () => {
  try {
    console.log("[v0] Attempting to connect to MongoDB...")
    console.log("[v0] MongoDB URI:", process.env.MONGODB_URI || "mongodb://localhost:27017/splitwise")

    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/splitwise", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("[v0] MongoDB Connected Successfully!")
    console.log("[v0] Database Name:", conn.connection.db.databaseName)
    console.log("[v0] Host:", conn.connection.host)
    console.log("[v0] Port:", conn.connection.port)
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error.message)
    console.error("[v0] Full error:", error)
    process.exit(1)
  }
}

// MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("[v0] Mongoose connected to MongoDB")
})

mongoose.connection.on("error", (err) => {
  console.error("[v0] Mongoose connection error:", err)
})

mongoose.connection.on("disconnected", () => {
  console.log("[v0] Mongoose disconnected from MongoDB")
})

// Connect to database
connectDB()

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
})

// Group Schema
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
})

// Expense Schema
const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  splitBetween: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      amount: { type: Number, required: true },
    },
  ],
  category: { type: String, default: "General" },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
})

// Settlement Schema
const settlementSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  description: { type: String, default: "Settlement payment" },
  date: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)
const Group = mongoose.model("Group", groupSchema)
const Expense = mongoose.model("Expense", expenseSchema)
const Settlement = mongoose.model("Settlement", settlementSchema)

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "fallback_secret", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hashedPassword })
    await user.save()

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "fallback_secret", {
      expiresIn: "7d",
    })

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "fallback_secret", {
      expiresIn: "7d",
    })

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Group Routes
app.get("/api/groups", authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId })
      .populate("members", "name email")
      .populate("createdBy", "name email")
    res.json(groups)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

app.post("/api/groups", authenticateToken, async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body

    const members = await User.find({ email: { $in: memberEmails } })
    const memberIds = members.map((member) => member._id)

    if (!memberIds.includes(req.user.userId)) {
      memberIds.push(req.user.userId)
    }

    const group = new Group({
      name,
      description,
      members: memberIds,
      createdBy: req.user.userId,
    })

    await group.save()
    await group.populate("members", "name email")
    await group.populate("createdBy", "name email")

    res.status(201).json(group)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Expense Routes
app.get("/api/groups/:groupId/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate("paidBy", "name email")
      .populate("splitBetween.user", "name email")
      .sort({ createdAt: -1 })
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

app.post("/api/groups/:groupId/expenses", authenticateToken, async (req, res) => {
  try {
    const { description, amount, splitBetween, category } = req.body

    const expense = new Expense({
      description,
      amount,
      paidBy: req.user.userId,
      group: req.params.groupId,
      splitBetween,
      category,
    })

    await expense.save()
    await expense.populate("paidBy", "name email")
    await expense.populate("splitBetween.user", "name email")

    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Balance calculation endpoint
app.get("/api/groups/:groupId/balances", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
    const settlements = await Settlement.find({ group: req.params.groupId })

    const balances = {}

    // Calculate balances from expenses
    expenses.forEach((expense) => {
      const paidById = expense.paidBy.toString()

      if (!balances[paidById]) balances[paidById] = 0
      balances[paidById] += expense.amount

      expense.splitBetween.forEach((split) => {
        const userId = split.user.toString()
        if (!balances[userId]) balances[userId] = 0
        balances[userId] -= split.amount
      })
    })

    // Apply settlements
    settlements.forEach((settlement) => {
      const fromId = settlement.from.toString()
      const toId = settlement.to.toString()

      if (!balances[fromId]) balances[fromId] = 0
      if (!balances[toId]) balances[toId] = 0

      balances[fromId] -= settlement.amount
      balances[toId] += settlement.amount
    })

    res.json(balances)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Settlement Routes
app.post("/api/groups/:groupId/settlements", authenticateToken, async (req, res) => {
  try {
    const { to, amount, description } = req.body

    const settlement = new Settlement({
      from: req.user.userId,
      to,
      amount,
      group: req.params.groupId,
      description,
    })

    await settlement.save()
    await settlement.populate("from", "name email")
    await settlement.populate("to", "name email")

    res.status(201).json(settlement)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Test endpoint to verify database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }

    res.json({
      status: "success",
      database: {
        state: states[dbState],
        name: mongoose.connection.db?.databaseName || "Not connected",
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      },
      message: "Database connection test successful",
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection test failed",
      error: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`)
  console.log(`[v0] Test database connection at: http://localhost:${PORT}/api/test-db`)
})
