"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false,
      },
      phone_2: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ci: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false,
      },
      url_img: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      rol_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      public_group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      state_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      parish_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addConstraint("users", {
      fields: ["rol_id"],
      type: "foreign key",
      name: "fk_roles_users",
      references: {
        table: "roles",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("users", {
      fields: ["public_group_id"],
      type: "foreign key",
      name: "fk_public_groups_users",
      references: {
        table: "public_groups",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("users", {
      fields: ["state_id"],
      type: "foreign key",
      name: "fk_states_users",
      references: {
        table: "states",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("users", {
      fields: ["city_id"],
      type: "foreign key",
      name: "fk_countries_users",
      references: {
        table: "cities",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("users", {
      fields: ["parish_id"],
      type: "foreign key",
      name: "fk_parishes_users",
      references: {
        table: "parishes",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("users", null, {});
  },
};
