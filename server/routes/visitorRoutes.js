const express = require('express');
const Visitor = require('../models/Visitor');
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });


// Create a new visitor with image upload
router.post("/", async (req, res) => {
  try {
      const { name, image, role, checkInDate, checkInTime, checkOutDate, checkOutTime, reason } = req.body;

      // Create a new visitor entry
      const newVisitor = new Visitor({
          name,
          image, // Store the Cloudinary image URL directly
          role,
          checkInDate: new Date(checkInDate),
          checkInTime,
          checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
          checkOutTime,
          reason,
      });

      const savedVisitor = await newVisitor.save();
      res.status(201).json({
          id: savedVisitor._id,
          name: savedVisitor.name,
          image: savedVisitor.image,
          role: savedVisitor.role,
          checkInDate: savedVisitor.checkInDate.toISOString().split('T')[0],
          checkInTime: savedVisitor.checkInTime,
          checkOutDate: savedVisitor.checkOutDate ? savedVisitor.checkOutDate.toISOString().split('T')[0] : null,
          checkOutTime: savedVisitor.checkOutTime,
          reason: savedVisitor.reason
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create visitor" });
  }
});
// In your backend routes
router.get('/all', async (req, res) => {
  try {
    const visitors = await Visitor.find({});
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get visitors with image paths
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const skip = (page - 1) * limit;
    const visitors = await Visitor.find()
    .sort({ _id: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Visitor.countDocuments();

    res.json({
      success: true,
      data: visitors.map(visitor => ({
        id: visitor._id,
        name: visitor.name,
        image: visitor.image,
        role: visitor.role,
        checkInDate: visitor.checkInDate.toISOString().split('T')[0],
        checkInTime: visitor.checkInTime,
        checkOutDate: visitor.checkOutDate ? visitor.checkOutDate.toISOString().split('T')[0] : null,
        checkOutTime: visitor.checkOutTime ? visitor.checkOutTime : null,
        reason: visitor.reason,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch visitors' });
  }
});

// Update visitor with image
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedVisitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json({
      id: updatedVisitor._id,
      name: updatedVisitor.name,
      image: updatedVisitor.image,
      role: updatedVisitor.role,
      checkInDate: updatedVisitor.checkInDate.toISOString().split('T')[0],
      checkInTime: updatedVisitor.checkInTime,
      checkOutDate: updatedVisitor.checkOutDate ? updatedVisitor.checkOutDate.toISOString().split('T')[0] : null,
      checkOutTime: updatedVisitor.checkOutTime,
      reason: updatedVisitor.reason
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update visitor' });
  }
});
// Delete visitor and their image
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Delete associated image if it exists
    if (visitor.image) {
      const imagePath = path.join(__dirname, '..', visitor.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Visitor.findByIdAndDelete(id);
    res.json({ message: 'Visitor deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete visitor' });
  }
});

module.exports = router;