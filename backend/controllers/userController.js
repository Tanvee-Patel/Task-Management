const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getUsers = async (req, res) => {
   try {
      const users = await User.find({ role: 'user' }).select('-password');

      const usersWithTaskCounts = await Promise.all(users.map(async (user) => {
         const pendingTaks = await Task.countDocuments({ assignedTo: user._id, status: "Pending" });
         const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: "In progress" });
         const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "Completed" });

         return {
            ...(user.toObject ? user.toObject() : user),
            pendingTaks,
            inProgressTasks,
            completedTasks
         }
      }))
      res.status(200).json(usersWithTaskCounts)
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const getUserById = async (req, res) => {
   try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

// const deleteUSer = async (req, res) => {
//    try {

//    }
//    catch (error) {
//       res.status(500).json({ message: "Server error", error: error.message })
//    }
// }

module.exports = {
   getUsers,
   getUserById,
   // deleteUSer
}