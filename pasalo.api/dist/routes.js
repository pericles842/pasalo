"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const plans_controller_1 = require("./app/controllers/plans.controller");
const company_controller_1 = require("./app/controllers/company.controller");
const router = (0, express_1.Router)();
//*Plans
router.get('/plans', plans_controller_1.PlansController.getAllPlans);
//*Company
router.post('/company', company_controller_1.CompanyController.registerCompanyProcess);
exports.default = router;
