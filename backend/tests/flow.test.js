const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const Flow = require('../models/Flow');
const User = require('../models/User');

let token;
let userId;
let flowId;

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGO_URI_TEST);
  
  // Create a test user
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };
  
  const res = await request(app).post('/api/auth/register').send(userData);
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  // Clean up
  await User.deleteMany({});
  await Flow.deleteMany({});
  
  // Disconnect from test database
  await mongoose.connection.close();
});

describe('Flow API', () => {
  it('should create a new flow', async () => {
    const flowData = {
      name: 'Test Flow',
      description: 'A test flow',
      nodes: [
        {
          id: 'node-1',
          type: 'coldEmail',
          position: { x: 100, y: 100 },
          data: {
            label: 'Welcome Email',
            email: {
              subject: 'Welcome to our service!',
              body: '<p>Thank you for signing up.</p>',
              to: 'customer@example.com'
            }
          }
        },
        {
          id: 'node-2',
          type: 'wait',
          position: { x: 100, y: 200 },
          data: {
            label: 'Wait 1 day',
            delay: '1d'
          }
        }
      ],
      edges: [
        {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'default',
            animated: true
          }
        ]
      };
      
      const res = await request(app)
        .post('/api/flows')
        .set('Authorization', `Bearer ${token}`)
        .send(flowData);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Flow');
      
      flowId = res.body.data._id;
    });
    
    it('should get all flows for current user', async () => {
      const res = await request(app)
        .get('/api/flows')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    it('should get a single flow', async () => {
      const res = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(flowId);
    });
    
    it('should update a flow', async () => {
      const updateData = {
        name: 'Updated Test Flow',
        description: 'An updated test flow'
      };
      
      const res = await request(app)
        .put(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Test Flow');
    });
    
    it('should activate a flow', async () => {
      const res = await request(app)
        .post(`/api/flows/${flowId}/activate`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.executionStatus).toBe('scheduled');
    });
    
    it('should deactivate a flow', async () => {
      const res = await request(app)
        .post(`/api/flows/${flowId}/deactivate`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
      expect(res.body.data.executionStatus).toBe('draft');
    });
    
    it('should delete a flow', async () => {
      const res = await request(app)
        .delete(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Verify it's deleted
      const checkRes = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(checkRes.statusCode).toEqual(404);
    });
    
    it('should schedule a single email', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
        delay: '1h'
      };
      
      const res = await request(app)
        .post('/api/flows/email/schedule')
        .set('Authorization', `Bearer ${token}`)
        .send(emailData);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduled).toBe(true);
    });
  });