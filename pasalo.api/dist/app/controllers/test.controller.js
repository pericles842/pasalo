"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const test_model_1 = require("../models/test.model");
class TestController {
    static async getTests(req, res, next) {
        try {
            const tests = await test_model_1.TestModel.findAll({ raw: true });
            res.json(tests);
        }
        catch (err) {
            next(err);
        }
    }
    static async createTest(req, res, next) {
        try {
            const test = await test_model_1.TestModel.create(req.body);
            res.json(test);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TestController = TestController;
