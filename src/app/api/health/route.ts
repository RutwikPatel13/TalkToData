/**
 * Health API route
 * GET: Report that the app answers and which commit it was built from.
 *
 * Read by the status page (status.rutwik.dev), which compares the commit
 * running here with the latest one on main. It reports nothing about the
 * session, the database or the host, so it needs no auth.
 */

import { NextResponse } from 'next/server';
import type { ApiResponse_t } from '@/types';

interface HealthResponse_t {
  commit: string | null;
  uptimeSeconds: number;
}

// Asked for on every check; a prerendered answer would freeze the uptime.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<ApiResponse_t<HealthResponse_t>>> {
  return NextResponse.json({
    success: true,
    data: {
      // Set by the Dockerfile from the commit the image was built at; absent
      // in local development.
      commit: process.env.GIT_SHA ?? null,
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
}
