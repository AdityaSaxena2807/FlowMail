const Agenda = require('agenda');
const emailService = require('./emailService');

// Initialize Agenda
const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'jobs',
    options: { useUnifiedTopology: true },
  },
  processEvery: '1 minute',
});

// Define job type for sending emails
agenda.define('send email', async job => {
  const { to, subject, html, flowId, nodeId } = job.attrs.data;
  
  try {
    await emailService.sendEmail(to, subject, html);
    console.log(`Email sent to ${to}`);
    
    // You might want to update the flow status in the database
    // to mark this node as completed
  } catch (error) {
    console.error('Failed to send email:', error);
    // You might want to retry logic here
  }
});

// Start agenda
(async function() {
  await agenda.start();
  console.log('Agenda started');
})();

// Helper function to schedule an email
const scheduleEmail = async (to, subject, html, delay, flowId, nodeId) => {
  // Convert delay to milliseconds if it's in minutes or hours format
  let delayMs = delay;
  if (typeof delay === 'string') {
    if (delay.includes('m')) {
      delayMs = parseInt(delay) * 60 * 1000;
    } else if (delay.includes('h')) {
      delayMs = parseInt(delay) * 60 * 60 * 1000;
    } else if (delay.includes('d')) {
      delayMs = parseInt(delay) * 24 * 60 * 60 * 1000;
    }
  }
  
  const when = new Date(Date.now() + delayMs);
  
  await agenda.schedule(when, 'send email', {
    to,
    subject,
    html,
    flowId,
    nodeId
  });
  
  return { scheduled: true, sendTime: when };
};

// Function to cancel scheduled emails (useful for updates)
const cancelScheduledEmails = async (flowId) => {
  await agenda.cancel({ 'data.flowId': flowId });
  return { canceled: true };
};

module.exports = {
  agenda,
  scheduleEmail,
  cancelScheduledEmails
};