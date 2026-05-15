import { NextFunction, Request, Response } from 'express';
import { TestResponse } from '../interfaces/test';
import { TestModel } from '../models/test.model';

export class TestController {
  static async getTests(req: Request, res: Response, next: NextFunction) {
    try {
      const tests = await TestModel.findAll({ raw: true });
      res.json(tests as TestResponse[]);
    } catch (err) {
      next(err);
    }
  }

  static async createTest(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await TestModel.create(req.body);
      res.json(test);
    } catch (err) {
      next(err);
    }
  }
}
