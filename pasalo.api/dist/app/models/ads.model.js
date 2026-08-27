"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const plans_ads_model_1 = require("./plans_ads.model");
// Un anuncio contratado. `folder_name` (ej. "ads-coffeecode") es la carpeta exclusiva
// de esa empresa con sus fotos: en S3 es un prefijo en la raiz del bucket, en disco
// vive bajo /uploads. Cual foto sale se decide al azar en runtime (ver adsEngine.ts).
// Ya no guarda su propio placement: en que ubicacion(es) aparece lo define el plan
// contratado (`plan_ads_id` -> `plans_ads.locations`), no una columna propia.
class AdModel extends sequelize_1.Model {
}
exports.AdModel = AdModel;
AdModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    plan_ads_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    company_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre de la empresa anunciante es requerido' }
        }
    },
    // Convencion obligatoria: "ads-" + slug de la empresa (ej. "ads-coffeecode").
    // Es la carpeta real dentro de /uploads/ads que el dueño llena a mano con las fotos.
    folder_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'La carpeta de imágenes es requerida' },
            is: {
                args: /^ads-[a-z0-9-]+$/i,
                msg: 'La carpeta debe empezar con el prefijo "ads-" seguido del nombre de la empresa (ej. ads-coffeecode)'
            }
        }
    },
    target_url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El enlace de destino es requerido' }
        }
    },
    priority: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 10
        }
    },
    start_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false
    },
    price_charged: {
        type: sequelize_1.DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            isNumeric: { msg: 'El precio cobrado debe ser un número válido' }
        }
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'paused', 'expired'),
        allowNull: false,
        defaultValue: 'active'
    },
    impressions_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    clicks_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    interval_seconds: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize: db_1.sequelize,
    tableName: 'ads',
    timestamps: true
});
AdModel.belongsTo(plans_ads_model_1.PlanAdsModel, { foreignKey: 'plan_ads_id', as: 'plan' });
plans_ads_model_1.PlanAdsModel.hasMany(AdModel, { foreignKey: 'plan_ads_id', as: 'ads' });
