// src/routes/user.routes.ts
import { Router } from 'express';
import {
  TestController
} from './app/controllers';
const router = Router();

//*Test
router.get('/tests', TestController.getTests);
router.post('/tests', TestController.createTest);


export default router;
