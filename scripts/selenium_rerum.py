# Import necessary modules from Selenium and other libraries
import sys
import time
import json  # For handling JSON
import requests  # For making the PUT request
from collections import OrderedDict  # To maintain the order of the JSON fields

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By  # For locating elements
from selenium.common.exceptions import UnexpectedAlertPresentException, NoAlertPresentException

# Set up Chrome options for headless mode and other settings
chrome_options = Options()
chrome_options.add_argument('--headless')  # Run Chrome in headless mode (no UI)
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1920,1080')

# Initialize the WebDriver with the Chrome options
driver = webdriver.Chrome(options=chrome_options)

# Step 1: Navigate to the login page
driver.get("http://lived-religion-dev.rerum.io/deer-lr/login")

# Step 2: Inject JavaScript to simulate the POST request using JSON (mimicking Postman behavior)
username = "Tester1"
password = "Tester1"

# Define the JavaScript code that will send the POST request with a JSON payload
login_script = f"""
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/deer-lr/login', true);  // Make sure the URL is correct
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {{
        if (xhr.readyState == 4 && xhr.status == 200) {{
            var response = JSON.parse(xhr.responseText);
            console.log('Response received:', response);  // You can access response data here
            document.body.setAttribute('data-response', JSON.stringify(response));  // Storing the response
        }}
    }};
    
    var data = JSON.stringify({{
        "username": "{username}",
        "password": "{password}"
    }});
    
    xhr.send(data);
"""

# Step 3: Execute the JavaScript code to perform the login and get the response
driver.execute_script(login_script)

# Step 4: Give time for the request to complete and response to be available
time.sleep(5)  # You can adjust the wait time or use a more efficient method

# Step 5: Handle unexpected alert
try:
    alert = driver.switch_to.alert
    print(f"Alert text: {alert.text}")
    alert.accept()  # Accept the alert
    print("Alert accepted")
except NoAlertPresentException:
    print("No alert present")

# Step 6: Extract the response stored in the 'data-response' attribute
user_data = driver.execute_script("return document.body.getAttribute('data-response');")

# Step 7: Print the user data (which should be in JSON format)
if user_data:
    print("User Data:", user_data)
    
    # Step 8: Parse the user data to extract the "@id" field
    user_data_json = json.loads(user_data)
    user_id_url = user_data_json.get('@id')
    
    if user_id_url:
        print("User @id URL:", user_id_url)
        
        # Step 9: Perform a GET request on the @id URL using Selenium
        driver.get(user_id_url)
        
        # Step 10: Locate the <pre> tag and extract the JSON within it
        try:
            pre_element = driver.find_element(By.TAG_NAME, 'pre')  # Locate the <pre> tag
            json_content = pre_element.text  # Extract the JSON text inside the <pre> tag
            existing_json = json.loads(json_content)  # Convert the JSON string to a Python dict
            
            print("Extracted JSON from @id page:", existing_json)
            
            # Step 11: Rebuild the JSON with "uid" placed directly below "name"
            # We use an OrderedDict to preserve the order of fields
            updated_json = OrderedDict()
            updated_json["@context"] = existing_json["@context"]
            updated_json["@id"] = existing_json["@id"]
            updated_json["@type"] = existing_json["@type"]
            updated_json["mbox"] = existing_json["mbox"]
            updated_json["label"] = existing_json["label"]
            updated_json["name"] = existing_json["name"]
            updated_json["uid"] = "JoZiRhOQk8UvQuotafBf43P900j1"  # Insert "uid" right after "name"
            
            # Add remaining fields from the original JSON
            for key, value in existing_json.items():
                if key not in updated_json:
                    updated_json[key] = value

            print("Updated JSON with UID in correct position:", updated_json)
            
            # Step 12: Perform the PUT request to update the data
            update_url = "http://lived-religion-dev.rerum.io/deer-lr/update"
            headers = {
                'Content-Type': 'application/json'
            }
            # Perform the PUT request using Python's requests library
            response = requests.put(update_url, headers=headers, data=json.dumps(updated_json))
            
            # Step 13: Check the response from the PUT request and extract the new @id
            if response.status_code == 200:
                update_response = response.json()
                new_id_url = update_response.get('@id')
                
                print("Update successful! New @id URL:", new_id_url)
                
                # Step 14: Navigate to the new @id URL to get its contents
                if new_id_url:
                    driver.get(new_id_url)
                    new_pre_element = driver.find_element(By.TAG_NAME, 'pre')
                    new_json_content = new_pre_element.text  # Extract the new JSON from <pre>
                    print("Contents of the new @id page:", new_json_content)
                else:
                    print("New @id not found in the response.")
            else:
                print(f"Update failed with status code: {response.status_code}")
                print("Server response:", response.text)
        except Exception as e:
            print("Failed to locate or extract JSON from <pre> tag.", e)
    else:
        print("@id field not found in the user data.")
else:
    print("No user data found. Please check the login process or payload.")

# Close the WebDriver
driver.quit()
