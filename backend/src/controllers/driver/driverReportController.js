import DeliveryIssue, { DELIVERY_ISSUE_TYPES } from '../../models/DeliveryIssue.js';
import DeliveryJob from '../../models/DeliveryJob.js';
import { isValidMongoId } from '../../utils/validation.js';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Colombo',
  year: 'numeric',
});
const dayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
});

function dateKey(value) {
  const parts = dateFormatter.formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function getDriverEarnings(request, response, next) {
  try {
    const jobs = await DeliveryJob.find({
      assignedDriver: request.user._id,
      status: 'delivered',
    })
      .select('jobCode cargoDescription payoutAmount deliveredAt destination scheduledPickupAt updatedAt')
      .sort({ deliveredAt: -1 });

    const now = new Date();
    const todayKey = dateKey(now);
    const monthKey = todayKey.slice(0, 7);
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      return { amount: 0, date: dateKey(date), label: dayFormatter.format(date) };
    });
    const weeklyByDate = new Map(weekly.map((day) => [day.date, day]));

    let todayEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;
    for (const job of jobs) {
      const completedDate = job.deliveredAt ?? job.updatedAt;
      const completedKey = dateKey(completedDate);
      totalEarnings += job.payoutAmount;
      if (completedKey === todayKey) todayEarnings += job.payoutAmount;
      if (completedKey.startsWith(monthKey)) monthEarnings += job.payoutAmount;
      const weeklyDay = weeklyByDate.get(completedKey);
      if (weeklyDay) weeklyDay.amount += job.payoutAmount;
    }

    return response.status(200).json({
      summary: {
        monthEarnings,
        todayEarnings,
        totalEarnings,
        totalTrips: jobs.length,
      },
      transactions: jobs.slice(0, 20),
      weekly,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createDeliveryIssue(request, response, next) {
  try {
    const { description, issueType, jobId, photoData } = request.body;
    if (!isValidMongoId(jobId)) {
      return response.status(400).json({ message: 'Enter a valid delivery job ID' });
    }
    if (!DELIVERY_ISSUE_TYPES.includes(issueType)) {
      return response.status(400).json({ message: 'Enter a valid delivery issue type' });
    }
    if (typeof description !== 'string' || description.trim().length < 10) {
      return response.status(400).json({
        message: 'Issue description must contain at least 10 characters',
      });
    }
    if (
      photoData !== undefined &&
      (typeof photoData !== 'string' ||
        !/^data:image\/(?:jpeg|png|webp);base64,/.test(photoData) ||
        photoData.length > 900000)
    ) {
      return response.status(400).json({ message: 'Attach a valid issue photo under 650 KB' });
    }

    const job = await DeliveryJob.exists({
      _id: jobId,
      assignedDriver: request.user._id,
      status: { $ne: 'available' },
    });
    if (!job) {
      return response.status(404).json({ message: 'Assigned delivery job not found' });
    }

    const issue = await DeliveryIssue.create({
      description: description.trim(),
      driver: request.user._id,
      issueType,
      job: jobId,
      photoAttached: Boolean(photoData),
      photoData,
    });
    await issue.populate('job', 'jobCode cargoDescription status');

    return response.status(201).json({
      issue,
      message: 'Delivery issue reported successfully',
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDeliveryIssues(request, response, next) {
  try {
    const issues = await DeliveryIssue.find({ driver: request.user._id })
      .populate('job', 'jobCode cargoDescription status')
      .sort({ createdAt: -1 });
    return response.status(200).json({ count: issues.length, issues });
  } catch (error) {
    return next(error);
  }
}
