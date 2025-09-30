const Task = require("../models/Task");

const getTasks = async (req, res) => {
   try {
      const { status } = req.query;
      let filter = {};

      if (status && status !== "All") {
         filter.status = status;
      }

      let tasks = req.user.role === "admin"
         ? await Task.find(filter).populate("assignedTo", "name email profileImageUrl")
         : await Task.find({ ...filter, assignedTo: req.user._id }).populate("assignedTo", "name email profileImageUrl");

      tasks = tasks.map(task => {
         const completedCount = task.todoChecklist.filter(item => item.completed).length;
         return {
            ...(task.toObject ? task.toObject() : task),
            completedTodoCount: completedCount
         }
      });


      // tasks = await Promise.all(tasks.map(async (task) => {
      //    const completedCount = task.todoChecklist.filter(item => item.completed).length;
      //    return {
      //       ...task._doc,
      //       completedTodoCount: completedCount
      //    }
      // }))

      const allTasks = await Task.countDocuments(
         req.user.role === "admin" ? {} : { assignedTo: req.user._id }
      );

      const pendingTasks = await Task.countDocuments({
         ...filter,
         status: "pending",
         ...(req.user.role !== "admin" ? { assignedTo: req.user._id } : {})
      })

      const inProgressTasks = await Task.countDocuments({
         ...filter,
         status: "In Progress",
         ...(req.user.role !== "admin" ? { assignedTo: req.user._id } : {})
      });

      const completedTasks = await Task.countDocuments({
         ...filter,
         status: "Completed",
         ...(req.user.role !== "admin" ? { assignedTo: req.user._id } : {})
      });

      res.json({
         tasks,
         statusSummary: {
            all: allTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks
         }
      })
   }

   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const getTaskById = async (req, res) => {
   try {
      const task = await Task.findById(req.params.id).populate(
         "assignedTo",
         "name email profileImageUrl"
      );

      if (!task) {
         return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const createTask = async (req, res) => {
   try {
      const { title, description, priority, dueDate, assignedTo, attachments, todoChecklist } = req.body;

      if (!Array.isArray(assignedTo)) {
         return res.status(400).json({ message: "assignedTo must be an array of user IDs" })
      }
      const task = await Task.create({
         title,
         description,
         priority,
         dueDate,
         assignedTo,
         createdBy: req.user._id,
         todoChecklist,
         attachments
      });

      res.status(201).json({ message: "Task created successfully", task });

   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const updateTask = async (req, res) => {
   try {
      const task = await Task.findById(req.params.id)

      if (!task) {
         return res.status(404).json({ message: "Task not found" });
      }

      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.priority = req.body.priority || task.priority;
      task.dueDate = req.body.dueDate || task.dueDate;
      task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
      task.attachments = req.body.attachments || task.attachments;

      if (req.body.assignedTo) {
         if (!Array.isArray(req.body.assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs" })
         }
         task.assignedTo = req.body.assignedTo;
      }

      const updateTask = await task.save();
      res.json({ message: "Task updated successfully", updateTask })

   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const deleteTask = async (req, res) => {
   try {
      const task = await Task.findById(req.params.id);

      if (!task) {
         return res.status(404).json({ message: "Task not found" });
      }

      await task.deleteOne()
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const updateTaskStatus = async (req, res) => {
   try {
      const task = await Task.findById(req.params.id);

      if (!task) {
         return res.status(404).json({ message: "Task not found" });
      }
      const isAssigned = task.assignedTo.some((userId) => userId.toString() === req.user._id.toString());

      if (!isAssigned && req.user.role !== "admin") {
         return res.status(403).json({ message: "You are not authorized to update this task" });
      }

      task.status = req.body.status || task.status;

      if (task.status === "Completed") {
         task.todoChecklist.forEach((item) => (item.completed = true));
         task.progress = 100;
      }

      await task.save();
      res.json({ message: "Task status updated successfully", task })
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const updateTaskChecklist = async (req, res) => {
   try {
      const { todoChecklist } = req.body;
      const task = await Task.findById(req.params.id);

      if (!task) {
         return res.status(404).json({ message: "Task not found" });
      }

      if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
         return res.status(403).json({ message: "You are not authorized to update this task" })
      }

      task.todoChecklist = todoChecklist;

      const completedCount = task.todoChecklist.filter((item) => item.completed).length;
      const totalItems = task.todoChecklist.length;

      task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

      if (task.progress === 100) {
         task.status = "Completed"
      } else if (task.progress > 0) {
         task.status = "In Progress";
      } else {
         task.status = "Pending"
      }

      await task.save();
      const updatedTask = await Task.findById(req.params.id).populate("assignedTo", "name email profileImageUrl");

      res.json({ message: "Task checklist updated successfully", task: updatedTask })
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const getDashboardData = async (req, res) => {
   try {
      const totalTasks = await Task.countDocuments();
      // console.log("➡️ Total tasks:", totalTasks);

      const pendingTasks = await Task.countDocuments({ status: "Pending" });
      // console.log("➡️ Pending tasks:", pendingTasks);

      const completedTasks = await Task.countDocuments({ status: "Completed" });
      // console.log("➡️ Completed tasks:", completedTasks);

      const overdueTaks = await Task.countDocuments({
         status: { $ne: "Completed" },
         dueDate: { $lt: new Date() },
      });
      // console.log("➡️ Overdue tasks:", overdueTaks);

      const taskStatuses = ["Pending", "In Progress", "Completed"];
      const taskDistributionRaw = await Task.aggregate([
         {
            $group: {
               _id: "$status",
               count: { $sum: 1 },
            }
         }
      ]);
      // console.log("🗂 Raw task distribution from DB:", taskDistributionRaw);

      const taskDistribution = taskStatuses.reduce((acc, status) => {
         const formattedKey = status.replace(/\s+/g, "");
         acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
         return acc;
      }, {});
      taskDistribution["All"] = totalTasks;
      // console.log("✅ Final taskDistribution:", taskDistribution);

      const taskPriorities = ["Low", "Medium", "High"];
      const taskPriorityLevelsRaw = await Task.aggregate([
         {
            $group: {
               _id: "$priority",
               count: { $sum: 1 }
            }
         }
      ]);
      // console.log("🗂 Raw task priorities from DB:", taskPriorityLevelsRaw);

      const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
         acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
         return acc;
      }, {});
      // console.log("✅ Final taskPriorityLevels:", taskPriorityLevels);

      const recentTasks = await Task.find()
         .sort({ createdAt: -1 })
         .limit(10)
         .select("title status priority dueDate createdAt");
      // console.log("📝 Recent tasks:", recentTasks);

      res.status(200).json({
         statistics: {
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTaks
         },
         charts: {
            taskDistribution,
            taskPriorityLevels,
         },
         recentTasks,
      });
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

const getUserDashboardData = async (req, res) => {
   try {
      // console.log("User id in request:", req.user._id);

      const userId = req.user._id;
      const totalTasks = await Task.countDocuments({ assignedTo: userId });
      // console.log("Total tasks", totalTasks);

      const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
      // console.log("Pending tasks", pendingTasks);

      const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
      // console.log("Completed tasks", completedTasks);

      const overdueTasks = await Task.countDocuments({
         assignedTo: userId,
         status: { $ne: "Completed" },
         dueDate: { $lt: new Date() }
      });
      // console.log("Overdue tasks", overdueTasks);

      const taskStatuses = ["Pending", "In Progress", "Completed"]
      const taskDistributionRaw = await Task.aggregate([
         { $match: { assignedTo: userId } },
         { $group: { _id: "$status", count: { $sum: 1 } } },
         { $project: { _id: 0, count: 1, status: "$_id" } }
      ]);
      // console.log("Task distribution raw", taskDistributionRaw);

      const taskDistribution = taskStatuses.reduce((acc, status) => {
         const formattedKey = status.replace(/\s+/g, "");
         acc[formattedKey] = taskDistributionRaw.find((item) => item.status === status)?.count || 0;
         return acc;
      }, {});
      taskDistribution["All"] = totalTasks;

      const taskPriorities = ["Low", "Medium", "High"];
      const taskPriorityLevelsRaw = await Task.aggregate([
         { $match: { assignedTo: userId } },
         { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]);

      const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
         acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
         return acc;
      }, {});

      const recentTasks = await Task.find({ assignedTo: userId })
         .sort({ createdAt: -1 })
         .limit(10)
         .select("title status priority dueDate createdAt");

      res.status(200).json({
         statistics: {
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
         },
         charts: {
            taskDistribution,
            taskPriorityLevels,
         },
         recentTasks
      });
   }
   catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
   }
}

module.exports = {
   getTasks,
   getTaskById,
   createTask,
   updateTask,
   deleteTask,
   updateTaskStatus,
   updateTaskChecklist,
   getDashboardData,
   getUserDashboardData
}