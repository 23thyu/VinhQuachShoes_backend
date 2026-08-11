require("dotenv").config();
const fs = require("fs");

const dialectOptions = {};
const caPath = __dirname + "/ca.pem";
const caFile = process.env.DB_DEV_SSL_CA || (fs.existsSync(caPath) ? fs.readFileSync(caPath) : null);

if (caFile) {
  dialectOptions.ssl = {
    ca: caFile,
    rejectUnauthorized: true,
  };
}

module.exports = {
  development: {
    username: process.env.DB_DEV_USERNAME,
    password: process.env.DB_DEV_PASSWORD || null,
    database: process.env.DB_DEV_DATABASE,
    port: parseInt(process.env.DB_DEV_PORT, 10),
    host: process.env.DB_DEV_HOST,
    dialect: process.env.DB_DEV_DIALECT,
    dialectOptions: Object.keys(dialectOptions).length > 0 ? dialectOptions : undefined,
  },
};
