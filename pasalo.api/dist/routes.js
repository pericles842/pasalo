"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const user_controller_1 = require("./app/controllers/user.controller");
const role_controller_1 = require("./app/controllers/role.controller");
const state_controller_1 = require("./app/controllers/state.controller");
const public_groups_controller_1 = require("./app/controllers/public_groups.controller");
const router = (0, express_1.Router)();
router.post("/users/create", user_controller_1.UserController.createUser);
router.post("/users/authenticate", user_controller_1.UserController.authenticateUser);
router.post("/users/refreshToken", user_controller_1.UserController.refreshToken);
//MUNICIPIOS Y CIUDADES
router.get("/states", state_controller_1.StatesController.getStates);
router.get("/cities/:id_state", state_controller_1.StatesController.getMunicipalities);
router.get("/parishes/:id_city", state_controller_1.StatesController.getParishes);
//Cajas de ahorro
router.get("/public_groups", public_groups_controller_1.PublicGroupsController.getPublicGroups);
//ROLES Y CARGOS
router.get("/roles", authMiddleware_1.authMiddleware, role_controller_1.RoleController.getRoles);
exports.default = router;
