const mongoose = require("mongoose")
require("dotenv").config()

const testConnection = async () => {
  try {
    console.log("🔄 Testing MongoDB connection...")
    console.log("📍 MongoDB URI:", process.env.MONGODB_URI || "mongodb://localhost:27017/splitwise")

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/splitwise", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("✅ MongoDB Connected Successfully!")
    console.log("📊 Database Name:", mongoose.connection.db.databaseName)
    console.log("🏠 Host:", mongoose.connection.host)
    console.log("🔌 Port:", mongoose.connection.port)

    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String })
    const TestModel = mongoose.model("Test", testSchema)

    const testDoc = new TestModel({ test: "Connection successful!" })
    await testDoc.save()
    console.log("✅ Test document created successfully!")

    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id })
    console.log("🧹 Test document cleaned up")

    await mongoose.connection.close()
    console.log("🔚 Connection closed successfully")
  } catch (error) {
    console.error("❌ MongoDB connection failed:")
    console.error("Error message:", error.message)
    console.error("Full error:", error)

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Troubleshooting tips:")
      console.log("1. Make sure MongoDB is running locally")
      console.log("2. Check if MongoDB service is started")
      console.log("3. Verify the connection string in your .env file")
    }

    process.exit(1)
  }
}

testConnection()
