import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models/Merchant";

function getDateRange(filter: string) {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (filter) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "this_week": {
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - now.getDay());
      start = new Date(firstDay.setHours(0, 0, 0, 0));
      const lastDay = new Date(start);
      lastDay.setDate(start.getDate() + 6);
      end = new Date(lastDay.setHours(23, 59, 59, 999));
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    default:
      break;
  }

  return { start, end };
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search")?.toLowerCase() || "";
  const status = searchParams.get("status")?.toLowerCase() || "";
  const dateFilter = searchParams.get("dateFilter")?.toLowerCase() || "all";
  const customStart = searchParams.get("startDate");
  const customEnd = searchParams.get("endDate");

  const query: any = {};

  if (search) {
    query.$or = [
      { "business.legalName": { $regex: search, $options: "i" } },
      { "personal.name": { $regex: search, $options: "i" } },
      { "personal.email": { $regex: search, $options: "i" } },
    ];
  }

  if (status && status !== "all") {
    query.status = status;
  }

  const { start, end } = getDateRange(dateFilter);

  if (customStart && customEnd) {
    query.createdAt = {
      $gte: new Date(customStart),
      $lte: new Date(customEnd),
    };
  } else if (start && end) {
    query.createdAt = { $gte: start, $lte: end };
  }

  const total = await Merchant.countDocuments(query);
  const merchants = await Merchant.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({
    data: merchants,
    total,
    page,
    limit,
  });
}