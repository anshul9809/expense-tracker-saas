const request = require('supertest');
const express = require("express");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const app = express();
app.use(express.json());
app.use("/api/v1/admin", require("../routes/adminRoutes"));

beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Admin Routes', () => {
    let adminToken;
    let userToken;
    let userId;
    let subscriptionPlanId;

    beforeAll(async () => {
        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@example.com',
            password: 'password',
            role: 'admin',
            verified: true
        });
        adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const regularUser = await User.create({
            name: 'User',
            email: 'user@example.com',
            password: 'password',
            role: 'user',
            verified: true
        });
        userToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        userId = regularUser._id;

        const subscriptionPlan = await SubscriptionPlan.create({
            planName: 'basic',
            description: 'Basic subscription plan',
            price: 9.99,
            duration: 'monthly'
        });
        subscriptionPlanId = subscriptionPlan._id;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await SubscriptionPlan.deleteMany({});
    });

    it('should log in as admin', async () => {
        const response = await request(app)
            .post('/api/v1/admin/login')
            .send({
                email: 'admin@example.com',
                password: 'password'
            });
        expect(response.status).toBe(200);
        expect(response.body.email).toBe('admin@example.com');
    });

    it('should get admin profile', async () => {
        const response = await request(app)
            .get('/api/v1/admin/profile')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.email).toBe('admin@example.com');
    });

    it('should not get admin profile with invalid token', async () => {
        const response = await request(app)
            .get('/api/v1/admin/profile')
            .set('Authorization', 'Bearer invalidtoken');
        expect(response.status).toBe(401);
    });

    it('should get all users', async () => {
        const response = await request(app)
            .get('/api/v1/admin/allUsers')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a user by id', async () => {
        const response = await request(app)
            .get(`/api/v1/admin/getUser/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.email).toBe('user@example.com');
    });

    it('should change user status', async () => {
        const response = await request(app)
            .put(`/api/v1/admin/changeStatus/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'inactive' });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('inactive');
    });

    it('should delete a user', async () => {
        const response = await request(app)
            .delete(`/api/v1/admin/deleteUser/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });

    it('should not allow a regular user to access admin routes', async () => {
        const response = await request(app)
            .get('/api/v1/admin/allUsers')
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(401);
    });

    it('should create a subscription plan', async () => {
        const response = await request(app)
            .post('/api/v1/admin/createSubscription')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                planName: 'premium',
                description: 'Premium subscription plan',
                price: 19.99,
                duration: 'yearly'
            });
        expect(response.status).toBe(200);
        expect(response.body.subscriptionPlan.planName).toBe('premium');
    });

    it('should update a subscription plan', async () => {
        const response = await request(app)
            .put(`/api/v1/admin/subscription/${subscriptionPlanId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                description: 'Updated description',
                price: 14.99
            });
        expect(response.status).toBe(200);
        expect(response.body.subscriptionPlan.description).toBe('Updated description');
        expect(response.body.subscriptionPlan.price).toBe(14.99);
    });

    it('should delete a subscription plan', async () => {
        const response = await request(app)
            .delete(`/api/v1/admin/subscription/${subscriptionPlanId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Plan deleted');
    });

    it('should get all subscription plans', async () => {
        const response = await request(app)
            .get('/api/v1/admin/subscription')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a single subscription plan by id', async () => {
        const newSubscriptionPlan = await SubscriptionPlan.create({
            planName: 'basic',
            description: 'basic subscription plan',
            price: 12.99,
            duration: 'monthly'
        });
        const response = await request(app)
            .get(`/api/v1/admin/subscription/${newSubscriptionPlan._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.planName).toBe('basic');
    });

    it('should handle not found subscription plan', async () => {
        const invalidId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .get(`/api/v1/admin/subscription/${invalidId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
});
