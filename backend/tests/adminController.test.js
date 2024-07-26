const request = require('supertest');
const app = require('../server'); // Adjust the path to your app
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

beforeAll(async () => {
    // Connect to the in-memory MongoDB server
    await mongoose.connect(`${process.env.MONGO_URL}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    // Close the MongoDB connection
    await mongoose.connection.close();
});

describe('Admin Routes', () => {
    let adminToken;
    let userToken;
    let userId;

    beforeAll(async () => {
        // Create a test admin user and generate a token
        
        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@example.com',
            password: "password",
            role: 'admin',
            verified:true
        });
        adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Create a test regular user and generate a token
        const regularUser = await User.create({
            name: 'User',
            email: 'user@example.com',
            password: "password",
            role: 'user',
            verified:true
        });
        userToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        userId = regularUser._id;
        console.log("regular user id is ", userId);
    });

    afterAll(async () => {
        // Cleanup: remove the test users
        await User.deleteMany({});
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
});
