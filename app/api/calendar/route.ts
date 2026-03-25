import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "GOOGLE_APPS_SCRIPT_URL não configurada no servidor",
        },
        { status: 500 },
      );
    }

    const body = await request.json();

    // Forward the POST request to the Google Apps Script URL.
    // Google Apps Script requires 'redirect: "follow"' for POST requests.
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error from Apps Script! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to Apps Script:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
