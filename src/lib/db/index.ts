import mysql, { Pool } from "mysql2/promise";
import Redis from "ioredis";
import { connectDB } from "@/lib/mongo";

let mysqlPool: Pool | null = null;
let redisClient: Redis | null = null;

export async function getMongoConnection() {
    return connectDB();
}

export async function getMysqlPool() {
    if (mysqlPool) return mysqlPool;
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL missing for MySQL connection");
    }
    mysqlPool = mysql.createPool(url);
    return mysqlPool;
}

export function getRedisClient() {
    if (redisClient) return redisClient;
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL missing for Redis connection");
    }
    redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
    });
    return redisClient;
}
