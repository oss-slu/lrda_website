import { NextResponse } from 'next/server';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';  // Import Firefox options
import fs from 'fs';
import path from 'path';  // To manage driver paths

// Utility function to add a delay (simulate processing time)
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// POST request handling (main logic with Selenium WebDriver and file operations)
export async function POST(request: Request) {
  console.log("API Hit");

  try {
    // Step 1: Parse the request body
    const { fullName, email, password, uid } = await request.json();

    // Step 2: Validate input fields
    if (!fullName || !email || !password || !uid) {
      console.error("Missing required fields:", { fullName, email, password, uid });
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Step 3: Explicitly set the path to GeckoDriver and Firefox Developer Edition binary
    const geckoDriverPath = '/opt/homebrew/bin/geckodriver';  // Path to geckodriver
    const firefoxBinaryPath = '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox';  // Correct path to Firefox Developer Edition
    const service = new firefox.ServiceBuilder(geckoDriverPath);

    // Step 4: Configure Firefox to run in headless mode and set the binary path
    const options = new firefox.Options();
    options.setBinary(firefoxBinaryPath);  // Set the Firefox binary location
    options.addArguments('--headless');  // Run Firefox in headless mode
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    // Step 5: Initialize Selenium WebDriver for Firefox with the driver service
    const driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxService(service)
      .setFirefoxOptions(options)
      .build();

    try {
      // Step 6: Navigate to the Rerum login page
      await driver.get('http://lived-religion-dev.rerum.io/deer-lr/login');

      // Step 7: Fill in the login form
      await driver.findElement(By.name('user')).sendKeys(fullName);
      await driver.findElement(By.name('pwd')).sendKeys(password);

      // Step 8: Submit the login form and wait for the page to load
      await driver.findElement(By.css('input[value=Login]')).click();
      await driver.wait(until.urlContains('dashboard'), 10000);  // Wait for dashboard

      // Step 9: Extract user data from the body attribute
      const userData = await driver.executeScript(() => {
        return document.body.getAttribute('data-response');
      });

      if (!userData) {
        console.error('No user data found.');
        await driver.quit();
        return NextResponse.json({ message: 'Failed to fetch user data' }, { status: 500 });
      }

      console.log('User Data:', userData);

      // Step 10: Save the user data to a file (simulating the first Python script)
      const userDataPath = './scripts/user_data.json';
      fs.writeFileSync(userDataPath, JSON.stringify({ fullName, email, userData }));

      // Step 11: Add a delay to simulate the time gap between scripts
      await delay(3000);  // 3-second delay

      // Step 12: Read the user_data.json file and update the UID
      const storedData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
      const userIdUrl = JSON.parse(storedData.userData)['@id'];  // Assuming @id is stored in userData

      await driver.get(userIdUrl);

      // Step 13: Extract the existing JSON from the <pre> tag
      const existingJson = await driver.findElement(By.tagName('pre')).getText();
      const jsonData = JSON.parse(existingJson);

      // Step 14: Update the UID in the JSON object
      jsonData['uid'] = uid;
      console.log('Updated JSON with UID:', jsonData);

      // Step 15: Perform a PUT request using Selenium to update the user data
      const updateResponse = await driver.executeScript(async (updatedJson: Record<string, any>) => {
        const response = await fetch('http://lived-religion-dev.rerum.io/deer-lr/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedJson),
        });
        return response.status;
      }, jsonData);

      console.log('Update Response Status:', updateResponse);

      // Step 16: Return a success response if the update was successful
      if (updateResponse === 200) {
        return NextResponse.json({ message: 'User successfully registered and UID updated in RERUM system' }, { status: 200 });
      } else {
        return NextResponse.json({ message: 'Failed to update UID in RERUM system' }, { status: updateResponse });
      }

    } catch (error) {
      console.error('Error executing Selenium WebDriver script:', error);
      return NextResponse.json({ message: 'Failed to register user or update UID in RERUM system', error: error.message }, { status: 500 });
    } finally {
      // Step 17: Close the browser after operation
      await driver.quit();
    }

  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// GET request handling (optional)
export async function GET() {
  return NextResponse.json({ message: 'This API route only supports POST requests for user registration.' });
}
