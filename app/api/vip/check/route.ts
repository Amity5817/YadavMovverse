// app/api/vip/check/route.ts - Fixed version
import { NextRequest, NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

export async function GET(request: NextRequest) {
  try {
    // Try multiple VIP check endpoints
    const endpoints = [
      `${API_BASE}/vip/member/rights-check`,
      `${API_BASE}/vip/member/detail`,
      `${API_BASE}/user-api/profile/v2`,
    ];

    let isVip = false;
    let vipData = null;

    for (const endpoint of endpoints) {
      try {
        const data = await makeApiRequest(endpoint);
        console.log(`📦 VIP check from ${endpoint}:`, data);
        
        // Check different response structures
        if (data?.isPassed || data?.vipEnable || data?.data?.isPassed || data?.data?.vipEnable) {
          isVip = true;
          vipData = data;
          break;
        }
      } catch (e) {
        console.log(`❌ ${endpoint} failed:`, e);
      }
    }

    return NextResponse.json({ 
      isVip: isVip,
      data: vipData,
      message: isVip ? 'VIP User - 1080p available' : 'Free User - 720p/480p available'
    });

  } catch (err) {
    console.error("VIP check error:", err);
    return NextResponse.json({ 
      isVip: false,
      message: 'VIP check failed - using free tier'
    });
  }
}