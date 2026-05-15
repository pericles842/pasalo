"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.States = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
class States {
    /**
     * Obtiene los estados
     *
     * @static
     * @return {*}
     * @memberof States
     */
    static async getStates() {
        try {
            const states = await db_1.sequelize.query(`select * from states`, {
                type: sequelize_1.QueryTypes.SELECT,
            });
            return states;
        }
        catch (error) {
            throw error;
        }
    }
    static async getMunicipalities(state_id) {
        try {
            const state = await db_1.sequelize.query(`SELECT * from cities  WHERE cities.state_id = :state_id`, {
                replacements: { state_id },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return state;
        }
        catch (error) {
            throw error;
        }
    }
    static async getParishes(city_id) {
        try {
            const state = await db_1.sequelize.query(`SELECT * from parishes  WHERE parishes.city_id = :city_id`, {
                replacements: { city_id },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return state;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.States = States;
