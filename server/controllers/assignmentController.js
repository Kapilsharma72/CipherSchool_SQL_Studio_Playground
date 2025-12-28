const Assignment = require('../models/Assignment');
const UserProgress = require('../models/UserProgress');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllAssignments = catchAsync(async (req, res, next) => {
  const assignments = await Assignment.find().sort({ createdAt: -1 });

    let assignmentsWithProgress = assignments;
  if (req.user && req.user.id) {
    try {
      const userId = req.user.id;
      const progressRecords = await UserProgress.find({ userId });
      
      const progressMap = {};
      progressRecords.forEach(progress => {
        progressMap[progress.assignmentId.toString()] = {
          isCompleted: progress.isCompleted,
          status: progress.status || (progress.isCompleted ? 'solved' : (progress.attemptCount > 0 ? 'started' : 'not_started')),
          attemptCount: progress.attemptCount,
          lastAttempt: progress.lastAttempt,
          sqlQuery: progress.sqlQuery
        };
      });

      assignmentsWithProgress = assignments.map(assignment => {
        const progress = progressMap[assignment._id.toString()] || {
          isCompleted: false,
          status: 'not_started',
          attemptCount: 0,
          lastAttempt: null,
          sqlQuery: ''
        };

        return {
          ...assignment.toObject(),
          progress
        };
      });
    } catch (progressError) {
            console.error('Error fetching progress:', progressError);
      assignmentsWithProgress = assignments.map(assignment => ({
        ...assignment.toObject(),
        progress: {
          isCompleted: false,
          status: 'not_started',
          attemptCount: 0,
          lastAttempt: null,
          sqlQuery: ''
        }
      }));
    }
  } else {
        assignmentsWithProgress = assignments.map(assignment => ({
      ...assignment.toObject(),
      progress: {
        isCompleted: false,
        status: 'not_started',
        attemptCount: 0,
        lastAttempt: null,
        sqlQuery: ''
      }
    }));
  }

  res.status(200).json({
    status: 'success',
    results: assignmentsWithProgress.length,
    data: {
      assignments: assignmentsWithProgress
    }
  });
});

exports.getAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return next(new AppError('No assignment found with that ID', 404));
  }

    let userProgress = null;
  if (req.user && req.user.id) {
    const progress = await UserProgress.findOne({
      userId: req.user.id,
      assignmentId: req.params.id
    });

    if (progress) {
      userProgress = {
        isCompleted: progress.isCompleted,
        status: progress.status || (progress.isCompleted ? 'solved' : (progress.attemptCount > 0 ? 'started' : 'not_started')),
        attemptCount: progress.attemptCount,
        lastAttempt: progress.lastAttempt,
        sqlQuery: progress.sqlQuery
      };
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      assignment: {
        ...assignment.toObject(),
        userProgress
      }
    }
  });
});

exports.saveProgress = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user.id) {
    return next(new AppError('You are not authenticated. Please log in.', 401));
  }

  const { sqlQuery, isCompleted } = req.body;
  const userId = req.user.id;
  const assignmentId = req.params.id;

    if (!assignmentId) {
    return next(new AppError('Assignment ID is required', 400));
  }

    if (isCompleted !== true && (!sqlQuery || !sqlQuery.trim())) {
    return next(new AppError('SQL query is required when saving progress', 400));
  }

    const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new AppError('No assignment found with that ID', 404));
  }

    const existingProgress = await UserProgress.findOne({ userId, assignmentId });
  const currentStatus = existingProgress?.status || 'not_started';
  const currentIsCompleted = existingProgress?.isCompleted || false;
  const currentAttemptCount = existingProgress?.attemptCount || 0;
  
          let newStatus = currentStatus;
  if (isCompleted === true) {
        newStatus = 'solved';
  } else if (currentStatus === 'not_started' && sqlQuery && sqlQuery.trim()) {
        newStatus = 'started';
  } else if (currentStatus === 'started') {
        newStatus = 'started';
  }
    
      const newAttemptCount = currentAttemptCount + 1;
  
    const updateData = {
    $set: {
      sqlQuery: sqlQuery || existingProgress?.sqlQuery || '',
      lastAttempt: new Date(),
      status: newStatus,
      attemptCount: newAttemptCount
    }
  };
  
    if (isCompleted !== undefined) {
    updateData.$set.isCompleted = isCompleted;
  } else if (!existingProgress) {
        updateData.$set.isCompleted = false;
  } else {
        updateData.$set.isCompleted = currentIsCompleted;
  }
  
      const progress = await UserProgress.findOneAndUpdate(
    { userId, assignmentId },
    updateData,
    { 
      new: true, 
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

    res.status(200).json({
    status: 'success',
    data: {
      progress: {
        isCompleted: progress.isCompleted,
        status: progress.status,
        attemptCount: progress.attemptCount,
        lastAttempt: progress.lastAttempt,
        sqlQuery: progress.sqlQuery
      }
    }
  });
});

exports.getProgress = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const assignmentId = req.params.id;

  const progress = await UserProgress.findOne({ userId, assignmentId });

  if (!progress) {
    return res.status(200).json({
      status: 'success',
      data: {
        progress: {
          isCompleted: false,
          status: 'not_started',
          attemptCount: 0,
          lastAttempt: null,
          sqlQuery: ''
        }
      }
    });
  }

    const progressData = progress.toObject();
  if (!progressData.status) {
    progressData.status = progressData.isCompleted ? 'solved' : (progressData.attemptCount > 0 ? 'started' : 'not_started');
  }

  res.status(200).json({
    status: 'success',
    data: {
      progress: progressData
    }
  });
});

