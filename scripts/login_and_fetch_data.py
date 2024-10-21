# login_and_fetch_data.py

import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException

# Set up Chrome options for headless mode and other settings
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1920,1080')

# Initialize the WebDriver with the Chrome options
driver = webdriver.Chrome(executable_path='/path/to/chromedriver', options=chrome_options)

# Step 1: Navigate to the login page
driver.get("http://lived-religion-dev.rerum.io/deer-lr/login")

# Step 2: Inject JavaScript to simulate the POST request using JSON
username = "Tester1"
password = "Tester1"

login_script = f"""
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/deer-lr/login', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {{
        if (xhr.readyState == 4 && xhr.status == 200) {{
            var response = JSON.parse(xhr.responseText);
            document.body.setAttribute('data-response', JSON.stringify(response));
        }} else if (xhr.readyState == 4) {{
            console.log('Error: Status', xhr.status);
        }}
    }};
    var data = JSON.stringify({{
        "username": "{username}",
        "password": "{password}"
    }});
    xhr.send(data);
"""

# Execute the JavaScript to perform the login
driver.execute_script(login_script)

# Step 4: Wait for the response
WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.TAG_NAME, 'body'))
)

# Handle any unexpected alerts
try:
    alert = driver.switch_to.alert
    alert.accept()
except NoAlertPresentException:
    pass

# Extract the response stored in the 'data-response' attribute
response = driver.execute_script("return document.body.getAttribute('data-response');")

if response:
    user_data_json = json.loads(response)
    user_id_url = user_data_json.get('@id')

    if user_id_url:
        print(f"User @id URL: {user_id_url}")

        # Save the user ID URL to a file to be used in the second script
        with open('user_data.json', 'w') as f:
            json.dump(user_data_json, f)

    else:
        print("@id field not found in the user data.")
else:
    print("No user data found.")

# Close the WebDriver
driver.quit()
