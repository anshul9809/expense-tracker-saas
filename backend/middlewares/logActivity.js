const ActivityLog = require('../models/ActivityLog');
const expressAsyncHandler = require('express-async-handler');

const logActivity = (activityType, itemType, getDetails = null) => {
  return expressAsyncHandler(async (req, res, next) => {
    try {
      // Capture the original response send method
      const originalSend = res.send;

      // Replace the send method with a function that logs the response data
      res.send = async function(data) {
        res.send = originalSend; // Restore the original send method
        res.responseData = data; // Store the response data
        return res.send(data); // Send the response
      };

      await next();

      // Determine details and itemId if provided
      const details = getDetails ? getDetails(req, activityType) : '';
      const itemId = req.params.id ? req.params.id : null;

      // Log success activity
      const newLog = new ActivityLog({
        userId: req.user._id,
        activityType,
        details,
        status: 'success',
        requestData: JSON.stringify(req.body),
        responseData: JSON.stringify(res.responseData),
        itemId,
        itemType
      });
      await newLog.save();
    } catch (error) {
      // Determine details and itemId if provided
      const details = getDetails ? getDetails(req, activityType) : '';
      const itemId = req.params.id ? req.params.id : null;

      // Log failure activity
      const newLog = new ActivityLog({
        userId: req.user._id,
        activityType,
        details,
        status: 'failure',
        errorMessage: error.message,
        statusCode: res.statusCode,
        requestData: JSON.stringify(req.body),
        itemId,
        itemType
      });
      await newLog.save();
      consolg.log("error is error");
      throw new Error(error); // Re-throw the error to propagate it
    }
  });
};

module.exports = logActivity;
