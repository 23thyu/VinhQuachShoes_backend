// const express = require("express");

// const app = express();
// require("dotenv").config();

import express from "express";
import dotenv from "dotenv";
import { AppRoute } from "./AppRoute";
import db from "./models/index.js";
import os from "os";
dotenv.config();
const app = express();
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

express.urlencoded({ extended: true });

app.get("/", async (req, res) => {
  res.send("this is ShopApp NodeJS and ReactJS ");
});
app.get("/api/healthcheck", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    //lấy thông tin CPU
    const cpuLoad = os.loadavg();

    //lấy thông tin Cpu trong %

    const memoryUsage = process.memoryUsage();
    //tính toán tải trong cpu

    const cpus = os.cpus();
    const cpuPercentage = (cpuLoad[0] / cpus.length) * 100;

    const memoryUsageMB = {
      rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
      heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
      heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
      external: (memoryUsage.external / 1024 / 1024).toFixed(2) + " MB",
    };

    // Trả về kết quả
    res.status(200).json({
      status: "OK",
      database: "Connected",
      cpuLoad: {
        "1 Minute Average Load": cpuLoad[0].toFixed(2),
        "5 Minute Average Load": cpuLoad[1].toFixed(2),
        "15 Minute Average Load": cpuLoad[2].toFixed(2),
        "CPU Usage Percentage": cpuPercentage.toFixed(2) + "%",
      },
      memoryUsage: memoryUsageMB,
    });
  } catch (error) {
    // Trường hợp có lỗi
    res.status(500).json({
      status: "Failed",
      message: "Health check failed",
      error: error.message,
    });
  }
});
AppRoute(app);
const port = process?.env?.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
