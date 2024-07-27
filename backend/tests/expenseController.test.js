const request = require('supertest');
const express = require("express");
const mongoose = require('mongoose');
const app = express();
const User = require('../models/User');
const Expense = require('../models/Expense');
const {errorHandler, notFound} = require("../middlewares/errorHandler");

// Middleware and routes
app.use(express.json());
app.use("/api/v1", require("../routes/index")); // Adjust the path to your routes
app.use(errorHandler);
app.use(notFound);

// Setup and teardown
beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await Expense.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Helper function to create user and get token
const createUserAndLogin = async () => {
    const user = await User.create({
        name: "Test User",
        email: "testuser@example.com",
        password: "password123",
        totalBalance: 5000,
        verified: true
    });
    const response = await request(app)
        .post("/api/v1/users/login")
        .send({
            email: "testuser@example.com",
            password: "password123"
        });
    return { token: response.body.token, userId: user._id };
};

// Tests
describe("Expense API Endpoints", () => {
    let token;
    let userId;

    beforeEach(async () => {
        const userLogin = await createUserAndLogin();
        token = userLogin.token;
        userId = userLogin.userId;
    });

    describe("POST /api/v1/expense/create", () => {
        it("should create an expense successfully", async () => {
            const response = await request(app)
                .post("/api/v1/expense/create")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Dinner",
                    amount: 50,
                    category: "Food",
                    description: "Dinner with friends"
                });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.expense.title).toBe("Dinner");
        });

        it("should not create an expense with insufficient balance", async () => {
            const response = await request(app)
                .post("/api/v1/expense/create")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Luxury Item",
                    amount: 6000,
                    category: "Other",
                    description: "Expensive item"
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Insufficient balance");
        });
    });

    describe("PUT /api/v1/expense/update/:id", () => {
        it("should update an expense successfully", async () => {
            const expense = await Expense.create({
                title: "Groceries",
                amount: 100,
                category: "Food",
                description: "Weekly groceries",
                user: userId
            });
            const response = await request(app)
                .put(`/api/v1/expense/update/${expense._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Updated Groceries",
                    amount: 150,
                    category: "Food",
                    description: "Updated groceries"
                });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.expense.title).toBe("Updated Groceries");
        });

        it("should not update an expense with insufficient balance", async () => {
            const expense = await Expense.create({
                title: "Groceries",
                amount: 100,
                category: "Food",
                description: "Weekly groceries",
                user: userId
            });
            const response = await request(app)
                .put(`/api/v1/expense/update/${expense._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Updated Groceries",
                    amount: 6000,
                    category: "Food",
                    description: "Updated groceries"
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Insufficient balance");
        });
    });

    describe("DELETE /api/v1/expense/delete/:id", () => {
        it("should delete an expense successfully", async () => {
            const expense = await Expense.create({
                title: "Gym Membership",
                amount: 75,
                category: "Other",
                description: "Monthly gym membership",
                user: userId
            });
            const response = await request(app)
                .delete(`/api/v1/expense/delete/${expense._id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Expense deleted successfully");
        });
    });

    describe("GET /api/v1/expense/:id", () => {
        it("should get a single expense", async () => {
            const expense = await Expense.create({
                title: "Utilities",
                amount: 120,
                category: "Utilities",
                description: "Monthly utilities bill",
                user: userId
            });
            const response = await request(app)
                .get(`/api/v1/expense/${expense._id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.expense.title).toBe("Utilities");
        });
    });

    describe("GET /api/v1/expense/", () => {
        it("should get all expenses for a user", async () => {
            await Expense.create({
                title: "Groceries",
                amount: 100,
                category: "Food",
                description: "Weekly groceries",
                user: userId
            });
            await Expense.create({
                title: "Gym Membership",
                amount: 75,
                category: "Other",
                description: "Monthly gym membership",
                user: userId
            });
            const response = await request(app)
                .get("/api/v1/expense/")
                .set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.expenses.length).toBe(2);
        });
    });
});
