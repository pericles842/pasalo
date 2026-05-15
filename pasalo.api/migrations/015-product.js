'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      brand: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      discount: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      reference: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      cost: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      price: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      min_stock: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'damaged'),
        allowNull: false
      },
      url_img: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type_product: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      attributes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      user_create_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      user_update_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addConstraint('products', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_products_category_id',
      references: {
        table: 'categories',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('products', {
      fields: ['user_create_id'],
      type: 'foreign key',
      name: 'fk_products_user_create_id',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('products', {
      fields: ['user_update_id'],
      type: 'foreign key',
      name: 'fk_products_user_update_id',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('products', null, {});
  }
};
