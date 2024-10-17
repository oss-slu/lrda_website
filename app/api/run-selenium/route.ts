import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

// Promisify the exec function to use async/await
const execPromise = promisify(exec);

export async function POST(request: Request) {
  console.log("API Hit");

  try {
    // Parse the request body
    const { fullName, email, password, uid } = await request.json();

    // Validate input fields
    if (!fullName || !email || !password || !uid) {
      console.error("Missing required fields:", { fullName, email, password, uid });
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Resolve the script path and construct the command
    const scriptPath = path.resolve('scripts', 'selenium_rerum.py'); // Adjust this path as per your project structure
    console.log('Script path resolved:', scriptPath);

    const command = `python3 ${scriptPath} "${fullName}" "${email}" "${password}" "${uid}"`;

    try {
      // Execute the command asynchronously
      console.log('Executing command:', command);
      const { stdout, stderr } = await execPromise(command);

      // Log the outputs for debugging
      if (stdout) {
        console.log('Selenium Script Output:', stdout);
      }
      if (stderr) {
        console.error('Selenium Script Errors:', stderr);
      }

      // Respond back that the script executed successfully
      return NextResponse.json({ message: 'User successfully registered in RERUM system' }, { status: 200 });
    } catch (execError) {
      // Log and return an error if script execution fails
      console.error('Error executing Selenium script:', execError.message);
      return NextResponse.json({ message: 'Failed to register user in RERUM system', error: execError.message }, { status: 500 });
    }
  } catch (error) {
    // Catch any errors in the POST handler
    console.error('Error in POST handler:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}


export async function GET() {
  return NextResponse.json({ message: 'This API route only supports POST requests for user registration.' });
}