
const cloudinary = require("cloudinary").v2;
const User = require("../model/user");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateUploadSignature = async (req, res) => {
  try {
    const userId = req.user._id; // Standardize to req.user._id
    console.log("User ID:", userId);

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Generate unique public_id and timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `profile_photos/${userId}_${timestamp}`;

    // Upload parameters including upload_preset
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
      upload_preset: "profile_photo_upload", // Required for signed uploads
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    console.log("Signature Parameters:", uploadParams);
    console.log("Generated Signature:", signature);
    console.log("API Secret (masked):", process.env.CLOUDINARY_API_SECRET?.substring(0, 4) + "...");

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      upload_preset: "profile_photo_upload",
    });
  } catch (error) {
    console.error("Error generating upload signature for profile photo:", error);
    res.status(500).json({ error: "Failed to generate upload credentials" });
  }
};

const savePhotoMetadata = async (req, res) => {
  try {
    const { cloudinaryPublicId, secureUrl } = req.body;
    const userId = req.user._id; // Standardize to req.user._id
    console.log("Saving metadata for userId:", userId, "publicId:", cloudinaryPublicId);

    // Verify the upload with Cloudinary
    const cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicId, {
      resource_type: "image",
    });

    if (!cloudinaryResource) {
      console.error("Cloudinary resource not found:", cloudinaryPublicId);
      return res.status(400).json({ error: "Photo not found on Cloudinary" });
    }

    // Update user's profile photo
    const user = await User.findByIdAndUpdate(
      userId,
      {
        Profile_Photo: secureUrl,
        Profile_Photo_PublicId: cloudinaryPublicId,
      },
      { new: true, select: "First_Name Last_Name Age Email_Id Role Profile_Photo Profile_Photo_PublicId _id" }
    );

    if (!user) {
      console.error("User not found for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    res.status(201).json({
      message: "Profile photo saved successfully",
      user: {
        id: user._id,
        First_Name: user.First_Name,
        Last_Name: user.Last_Name,
        Age: user.Age,
        Email_Id: user.Email_Id,
        Role: user.Role,
        Profile_Photo: user.Profile_Photo,
        Profile_Photo_PublicId: user.Profile_Photo_PublicId,
      },
    });
  } catch (error) {
    console.error("Error saving profile photo metadata:", error);
    res.status(500).json({ error: "Failed to save photo metadata" });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const userId = req.user._id; // Standardize to req.user._id
    console.log("Deleting photo for userId:", userId);

    const user = await User.findById(userId);
    if (!user || !user.Profile_Photo_PublicId) {
      console.error("Profile photo not found for userId:", userId);
      return res.status(404).json({ error: "Profile photo not found" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.Profile_Photo_PublicId, {
      resource_type: "image",
      invalidate: true,
    });

    // Reset user's profile photo fields
    await User.findByIdAndUpdate(userId, {
      Profile_Photo: "",
      Profile_Photo_PublicId: "",
    });

    res.json({ message: "Profile photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile photo:", error);
    res.status(500).json({ error: "Failed to delete profile photo" });
  }
};

module.exports = { generateUploadSignature, savePhotoMetadata, deletePhoto };