import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { PlanAdsModel } from './plans_ads.model';

// Un anuncio contratado. `folder_name` (ej. "ads-coffeecode") es la carpeta exclusiva
// de esa empresa con sus fotos: en S3 es un prefijo en la raiz del bucket, en disco
// vive bajo /uploads. Cual foto sale se decide al azar en runtime (ver adsEngine.ts).
// Ya no guarda su propio placement: en que ubicacion(es) aparece lo define el plan
// contratado (`plan_ads_id` -> `plans_ads.locations`), no una columna propia.
export class AdModel extends Model<InferAttributes<AdModel>, InferCreationAttributes<AdModel>> {
    declare id: CreationOptional<number>;

    declare plan_ads_id: number;
    declare company_name: string;
    declare folder_name: string;
    declare target_url: string;
    declare priority: CreationOptional<number>;
    declare start_date: string;
    declare end_date: string;
    declare price_charged: number;
    declare status: CreationOptional<'active' | 'paused' | 'expired'>;
    declare impressions_count: CreationOptional<number>;
    declare clicks_count: CreationOptional<number>;
    // Cada cuantos segundos se vuelve a disparar (lo usa sobre todo el placement 'modal')
    declare interval_seconds: CreationOptional<number | null>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

AdModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        plan_ads_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        company_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre de la empresa anunciante es requerido' }
            }
        },
        // Convencion obligatoria: "ads-" + slug de la empresa (ej. "ads-coffeecode").
        // Es la carpeta real dentro de /uploads/ads que el dueño llena a mano con las fotos.
        folder_name: {
            type: DataTypes.STRING(255),
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
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El enlace de destino es requerido' }
            }
        },
        priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 10
            }
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        price_charged: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: {
                isNumeric: { msg: 'El precio cobrado debe ser un número válido' }
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'paused', 'expired'),
            allowNull: false,
            defaultValue: 'active'
        },
        impressions_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        clicks_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        interval_seconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'ads',
        timestamps: true
    }
);

AdModel.belongsTo(PlanAdsModel, { foreignKey: 'plan_ads_id', as: 'plan' });
PlanAdsModel.hasMany(AdModel, { foreignKey: 'plan_ads_id', as: 'ads' });
