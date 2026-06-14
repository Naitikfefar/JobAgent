const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Compute level from xp using thresholds
function computeLevelFromXp(xp) {
  const thresholds = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1; // levels 1..10
  }
  return 1;
}

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    // Check if email already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email: email.toLowerCase(),
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user.id);

    // Return token and user data
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update lastActive
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    // Return token and user data
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get XP profile (xp, level, achievements, streak, quests)
exports.getXpProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('xp level achievements streak quests xpHistory');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ xp: user.xp, level: user.level, achievements: user.achievements, streak: user.streak, quests: user.quests, xpHistory: user.xpHistory });
  } catch (error) {
    console.error('getXpProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Award XP to current user
exports.awardXp = async (req, res) => {
  try {
    const { amount, reason, achievement } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.xp = (user.xp || 0) + amount;
    user.xpHistory = user.xpHistory || [];
    user.xpHistory.push({ amount, reason: reason || 'manual', date: new Date() });

    // Optional achievement object { id, name, description, points }
    if (achievement && achievement.id) {
      user.achievements = user.achievements || [];
      const exists = user.achievements.find(a => a.id === achievement.id);
      if (!exists) {
        user.achievements.push({ id: achievement.id, name: achievement.name, description: achievement.description, points: achievement.points || 0, earnedAt: new Date() });
      }
    }

    // Recompute level
    user.level = computeLevelFromXp(user.xp);

    await user.save();

    res.json({ xp: user.xp, level: user.level, achievements: user.achievements });
  } catch (error) {
    console.error('awardXp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profile, jobPreferences, telegramChatId, skills, preferredRoles, remoteOnly, currentRole, experienceYears } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profile) user.profile = profile;
    if (jobPreferences) user.jobPreferences = jobPreferences;
    if (telegramChatId !== undefined) user.telegramChatId = telegramChatId;

    // Custom profile fields
    user.profile = user.profile || {};
    if (skills) user.profile.skills = skills;
    if (preferredRoles) user.profile.preferredRoles = preferredRoles;
    if (remoteOnly !== undefined) user.profile.remoteOnly = remoteOnly;
    if (currentRole) user.profile.currentRole = currentRole;
    if (experienceYears) user.profile.experienceYears = experienceYears;

    await user.save();
    res.json({ message: 'Profile updated', profile: user.profile });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
