const { sendEmail } = require('../services/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
  let mockSendMail;
  
  beforeEach(() => {
    // Create a mock implementation of sendMail
    mockSendMail = jest.fn().mockResolvedValue({
      messageId: 'mock-message-id',
      response: 'OK'
    });
    
    // Mock the transporter
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
      verify: jest.fn().mockResolvedValue(true)
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should send an email successfully', async () => {
    const to = 'recipient@example.com';
    const subject = 'Test Subject';
    const html = '<p>Test content</p>';
    
    const result = await sendEmail(to, subject, html);
    
    expect(mockSendMail).toHaveBeenCalledWith({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html
    });
    
    expect(result).toEqual({
      messageId: 'mock-message-id',
      response: 'OK'
    });
  });
  
  it('should handle errors when sending an email', async () => {
    const error = new Error('Email sending failed');
    mockSendMail.mockRejectedValue(error);
    
    try {
      await sendEmail('recipient@example.com', 'Test', '<p>Content</p>');
      // If we get here, the test should fail
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBe(error);
    }
  });
});