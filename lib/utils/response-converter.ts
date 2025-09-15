import { NextResponse } from "next/server";

/**
 * Convert Response to NextResponse if needed
 */
export async function ensureNextResponse(response: Response): Promise<NextResponse> {
  if (response instanceof NextResponse) {
    return response;
  }

  // Convert Response to NextResponse
  try {
    const body = await response.text();
    let jsonBody;
    
    try {
      jsonBody = JSON.parse(body);
    } catch {
      jsonBody = { message: body };
    }

    const nextResponse = NextResponse.json(jsonBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy headers
    response.headers.forEach((value, key) => {
      nextResponse.headers.set(key, value);
    });

    return nextResponse;
  } catch (error) {
    console.error("Error converting Response to NextResponse:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}