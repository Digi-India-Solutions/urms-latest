const express = require('express');
const { uploadTasks, getTask, updateTask, deleteTask, updateOverallStatusTask } = require('../Controllers/taskController');
const upload = require('../Middleware/Multer');
const TaskRouter = express.Router();

TaskRouter.post('/upload-task', upload.single('file'), uploadTasks);
TaskRouter.get('/get-all-task', getTask);
TaskRouter.delete('/delete-task/:id', deleteTask);
TaskRouter.put('/update-task/:id', updateTask);
TaskRouter.put('/update-overallStatus-task/:id', updateOverallStatusTask);

module.exports = TaskRouter;
