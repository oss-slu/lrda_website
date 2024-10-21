# update_uid.py

import json
import requests
from collections import OrderedDict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Set up Chrome options for headless mode and other settings
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1920,1080')

# Initialize the WebDriver with the Chrome options
driver = webdriver.Chrome(executable_path='/path/to/chromedriver', options=chrome_options)

# Load the user data from the file saved by the first script
with open('user_data.json', 'r') as f:
    user_data_json = json.load(f)

user_id_url = user_data_json.get('@id')

if user_id_url:
    print(f"User @id URL: {user_id_url}")
    
    # Step 9: Perform a GET request on the @id URL using Selenium
    driver.get(user_id_url)
    
    # Step 10: Locate the <pre> tag and extract the JSON within it
    pre_element = driver.find_element(By.TAG_NAME, 'pre')
    json_content = pre_element.text
    existing_json = json.loads(json_content)

    # Step 11: Rebuild the JSON with the UID
    updated_json = OrderedDict()
    updated_json["@context"] = existing_json["@context"]
    updated_json["@id"] = existing_json["@id"]
    updated_json["@type"] = existing_json["@type"]
    updated_json["mbox"] = existing_json["mbox"]
    updated_json["label"] = existing_json["label"]
    updated_json["name"] = existing_json["name"]
    updated_json["uid"] = "JoZiRhOQk8UvQuotafBf43P900j1"

    for key, value in existing_json.items():
        if key not in updated_json:
            updated_json[key] = value

    # Step 12: Perform the PUT request to update the data
    update_url = "http://lived-religion-dev.rerum.io/deer-lr/update"
    headers = {'Content-Type': 'application/json'}
    response = requests.put(update_url, headers=headers, data=json.dumps(updated_json))

    # Step 13: Check the response from the PUT request
    if response.status_code == 200:
        print("Update successful!")
        update_response = response.json()
        new_id_url = update_response.get('@id')
        print(f"New @id URL: {new_id_url}")
        
        # Step 14: Navigate to the new @id URL to verify the update
        driver.get(new_id_url)
        new_pre_element = driver.find_element(By.TAG_NAME, 'pre')
        print(f"Contents of the new @id page:\n{new_pre_element.text}")
    else:
        print(f"Update failed with status code: {response.status_code}")
        print("Server response:", response.text)
else:
    print("@id field not found in the user data.")

# Close the WebDriver
driver.quit()
