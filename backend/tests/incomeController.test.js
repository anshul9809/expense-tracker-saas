const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const Income = require('../models/Income');
const User = require('../models/User');
const { notFound, errorHandler } = require('../middlewares/errorHandler');

app.use(express.json());

// Mock routes for testing
app.use('/api/v1/income', require('../routes/incomeRoutes'));

app.use(notFound);
app.use(errorHandler);

beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Income Controller', () => {
    let userToken;
    let userId;
    let incomeId;
    let recurringIncomeId;

    beforeAll(async () => {
        // Create a test user and generate a token
        const user = await User.create({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password',
            role: 'user',
            verified: true,
            totalIncome: 0,
            totalExpense: 0,
            totalBalance: 0,
            totalSavings: 0,
        });
        userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        userId = user._id;
    });

    afterAll(async () => {
        // Cleanup: remove test data
        await User.deleteMany({});
        await Income.deleteMany({});
    });

    it('should create an income', async () => {
        const response = await request(app)
            .post('/api/v1/income/create')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Salary',
                amount: 5000,
                category: 'Job',
                description: 'Monthly salary',
                date: new Date(),
            });
        expect(response.status).toBe(201);
        expect(response.body.income).toBeTruthy();
        expect(response.body.income.title).toBe('Salary');
        incomeId = response.body.income._id; // Save the income ID for further tests
    });

    it('should update an income', async () => {
        const response = await request(app)
            .put(`/api/v1/income/update/${incomeId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Updated Salary',
                amount: 6000,
                category: 'Job',
                description: 'Updated monthly salary',
                date: new Date(),
            });
        expect(response.status).toBe(200);
        expect(response.body.income).toBeTruthy();
        expect(response.body.income.title).toBe('Updated Salary');
    });

    it('should create a recurring income', async () => {
        const response = await request(app)
            .post('/api/v1/income/create')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Freelance',
                amount: 3000,
                category: 'Freelance',
                description: 'Weekly freelance payment',
                date: new Date(),
                isRecurring: true,
                recurrenceInterval: 'weekly',
            });
        expect(response.status).toBe(201);
        expect(response.body.income).toBeTruthy();
        expect(response.body.income.title).toBe('Freelance');
        expect(response.body.income.isRecurring).toBe(true);
        expect(response.body.income.recurrenceInterval).toBe('weekly');
        recurringIncomeId = response.body.income._id; // Save the recurring income ID for further tests
    });

    it('should update a recurring income', async () => {
        const response = await request(app)
            .put(`/api/v1/income/update/${recurringIncomeId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Updated Freelance',
                amount: 3500,
                category: 'Freelance',
                description: 'Updated weekly freelance payment',
                date: new Date(),
                isRecurring: true,
                recurrenceInterval: 'weekly',
            });
        expect(response.status).toBe(200);
        expect(response.body.income).toBeTruthy();
        expect(response.body.income.title).toBe('Updated Freelance');
        expect(response.body.income.amount).toBe(3500);
    });

    it('should get a single income', async () => {
        const response = await request(app)
            .get(`/api/v1/income/${incomeId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body.income).toBeTruthy();
        expect(response.body.income._id).toBe(incomeId);
    });

    it('should get all incomes', async () => {
        const response = await request(app)
            .get('/api/v1/income')
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body.incomes).toBeTruthy();
        expect(response.body.incomes.length).toBeGreaterThan(0);
    });

    it('should delete an income', async () => {
        const response = await request(app)
            .delete(`/api/v1/income/delete/${incomeId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Income deleted successfully');
    });

    it('should delete a recurring income', async () => {
        const response = await request(app)
            .delete(`/api/v1/income/delete/${recurringIncomeId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Income deleted successfully');
    });
});
