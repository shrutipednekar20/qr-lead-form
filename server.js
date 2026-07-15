const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/qr_leads';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema & Model
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    contact: { type: String, default: "" },
    company: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// API Route 1: Save email immediately when "Next" is clicked on Page 1
app.post('/api/save-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user already exists; if not, create a new record
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email });
            await user.save();
        }

        // Return the document _id to the frontend to link Page 2 details
        res.status(200).json({ userId: user._id, message: "Email recorded successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Route 2: Update the remaining details when "Submit" is clicked on Page 2
app.post('/api/save-details', async (req, res) => {
    try {
        const { userId, name, contact, company } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User reference ID missing.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, contact, company },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User record not found." });
        }

        res.status(200).json({ message: "Profile successfully updated." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Wildcard Route: Handles any frontend routing by serving the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));