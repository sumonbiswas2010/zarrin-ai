const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const User = db.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  slack_id: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  team_id: {
    type: Sequelize.STRING,
  },
  display_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  nickname: {
    type: Sequelize.STRING,
  },
  is_admin: {
    type: Sequelize.BOOLEAN,
  },
  is_owner: {
    type: Sequelize.BOOLEAN,
  },
  is_bot: {
    type: Sequelize.BOOLEAN,
  },
  image: {
    type: Sequelize.STRING,
  },
});

// const sync = async () => {
//   try {
//     await User.sync({ alter: true });
//   } catch (e) {
//     console.log(e)
//   }
// };
// sync();

// User.sync({ alter: true });
module.exports = User;
