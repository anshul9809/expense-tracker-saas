const request = require('supertest');
const express = require("express");
const app = express(); // Adjust the path to your app
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const Income = require("../models/Income");
const {errorHandler, notFound} = require("../middlewares/errorHandler");


app.use(express.json());
app.use("/api/v1", require("../routes/index"));
app.use(errorHandler);
app.use(notFound);

// Connect to a test database before running tests
beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

// Clean up the database after each test
afterEach(async () => {
    await User.deleteMany();
    await Income.deleteMany();
    await User.deleteMany();
});

// Close the connection after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

// Helper function to create a user and get a token
const createUserAndLogin = async (status = "active") => {
    const user = await request(app)
        .post("/api/v1/users/register")
        .send({
            name: "Test User",
            email: "testuser@example.com",
            password: "password123",
            status: `${status}`,
            verified: true
        });
    const response = await request(app)
        .post("/api/v1/users/login")
        .send({
            email: "testuser@example.com",
            password: "password123"
        });

    return { token: response.body.token, userId: response.body._id };
};

// Test cases for incomeController
describe("Income Controller", () => {
    let token;
    let userId;

    beforeEach(async () => {
        const userLogin = await createUserAndLogin();
        token = userLogin.token;
        userId = userLogin.userId;
    });

    test("should create an income", async () => {
        const response = await request(app)
            .post("/api/v1/income/create")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Salary",
                amount: 5000,
                category: "Salary",
                description: "Monthly salary"
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.income.title).toBe("Salary");
        expect(response.body.income.amount).toBe(5000);
    });

    test("should not create an income with missing fields", async () => {
        const response = await request(app)
            .post("/api/v1/income/create")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Salary",
                // amount is missing
                category: "Salary",
                description: "Monthly salary"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Please add all required fields");
    });

    test("should update an income", async () => {
        const income = await Income.create({
            title: "Freelance",
            amount: 3000,
            category: "Freelancing",
            description: "Freelance project",
            user: userId
        });

        const response = await request(app)
            .put(`/api/v1/income/update/${income._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Updated Freelance",
                amount: 3500,
                category: "Freelancing",
                description: "Updated freelance project"
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.income.title).toBe("Updated Freelance");
        expect(response.body.income.amount).toBe(3500);
    });

    test("should get a single income", async () => {
        const income = await Income.create({
            title: "Freelance",
            amount: 3000,
            category: "Freelancing",
            description: "Freelance project",
            user: userId
        });

        const response = await request(app)
            .get(`/api/v1/income/${income._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.income.title).toBe("Freelance");
        expect(response.body.income.amount).toBe(3000);
    });

    test("should get all incomes", async () => {
        await Income.create({
            title: "Freelance",
            amount: 3000,
            category: "Freelancing",
            description: "Freelance project",
            user: userId
        });

        await Income.create({
            title: "Salary",
            amount: 5000,
            category: "Salary",
            description: "Monthly salary",
            user: userId
        });

        const response = await request(app)
            .get("/api/v1/income/")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.incomes.length).toBe(2);
    });

    test("should delete an income", async () => {
        const income = await Income.create({
            title: "Freelance",
            amount: 3000,
            category: "Freelancing",
            description: "Freelance project",
            user: userId
        });

        const response = await request(app)
            .delete(`/api/v1/income/delete/${income._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Income deleted successfully");
    });

});
