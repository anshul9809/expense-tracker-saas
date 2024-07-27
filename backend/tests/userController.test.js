const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use("/api/v1/users", require("../routes/userRoutes"));

beforeAll(async () => {
    // Connect to a test database before running the tests
    await mongoose.connect(process.env.TEST_DB_URL);
});

afterAll(async () => {
    // Close the database connection after tests
    await mongoose.connection.close();
});

afterEach(async () => {
    await User.deleteMany();
});


describe("User Controller Tests", () => {
    let token;
    let userId;

    // Helper function to create a user
    const createUser = async () => {
        const user = {
            name: "Test User",
            email: "testuser@example.com",
            password: "testpassword",
            phone: "1234567890",
            address: { street: "123 Main St", city: "Test City", state: "TS", zipcode: "12345" },
            dateOfBirth: "1990-01-01",
            verified:true
        };
        const res = await request(app).post("/api/v1/users/register").send(user);
        if(res.body.token){
            token = res.body.token;
        }
        userId = res.body._id;
    };

    afterAll(async () => {
        // Cleanup: remove the test users
        await User.deleteMany({});
    });

    it("should register a new user", async () => {
        const user = {
            name: "John Doe",
            email: "johndoe@example.com",
            password: "password123",
            phone: "9876543210",
            verified:true
        };

        const res = await request(app).post("/api/v1/users/register").send(user);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("token");
    });

    it("should login a user", async () => {
        await createUser();
        const res = await request(app).post("/api/v1/users/login").send({
            email: "testuser@example.com",
            password: "testpassword"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        token = res.body.token;
    });

    it("should get user profile", async () => {
        await createUser();
        const res = await request(app).get("/api/v1/users/profile").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("name", "Test User");
    });

    it("should update user profile", async () => {
        await createUser();
        const res = await request(app)
            .put("/api/v1/users/profile/update")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Name" });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("name", "Updated Name");
    });

    it("should update user password", async () => {
        await createUser();
        const res = await request(app)
            .post("/api/v1/users/update/password")
            .set("Authorization", `Bearer ${token}`)
            .send({ oldPassword: "testpassword", password: "newpassword123", confirmPassword: "newpassword123" });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Password Updated successfully");
    });

    it("should send forgot password email", async () => {
        await createUser();
        const res = await request(app).post("/api/v1/users/forgotPassword").send({ email: "testuser@example.com" });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Email sent");
    });

    it("should reset password", async () => {
        await createUser();
        const user = await User.findOne({ email: "testuser@example.com" });
        const resetToken = user.getPasswordResetToken();
        await user.save();
        const res = await request(app).put(`/api/v1/users/resetPassword/${resetToken}`).send({
            password: "demopassword",
            confirmPassword: "demopassword"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Password reset successful");
    });

    it("should verify email", async () => {
        await createUser();
        const user = await User.findOne({ email: "testuser@example.com" });
        const verificationToken = user.verificationToken;
        const res = await request(app).get(`/api/v1/users/verify-email/${verificationToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Email verified successfully");
    });

    it("should logout a user", async () => {
        await createUser();
        const res = await request(app).get("/api/v1/users/logout").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Logged out successfully");
    });
});
