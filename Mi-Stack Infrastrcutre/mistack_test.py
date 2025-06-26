from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import sys

# === Helpers ===

def wait_for_full_load(driver, timeout=15):
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )

def wait_for_invisibility(driver, by, locator, timeout=15):
    try:
        WebDriverWait(driver, timeout).until(
            EC.invisibility_of_element_located((by, locator))
        )
    except:
        pass

def attempt_login(driver, email_val, password_val):
    try:
        email_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        password_field = driver.find_element(By.NAME, "password")
        login_button = driver.find_element(By.TAG_NAME, "button")

        email_field.clear()
        email_field.send_keys(email_val)
        password_field.clear()
        password_field.send_keys(password_val)

        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.TAG_NAME, "button"))
        )
        login_button.click()

        wait_for_full_load(driver)
        wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

        if "Login" not in driver.page_source and "Mi-Stack" in driver.title:
            return True
        else:
            return False
    except Exception:
        return False

def delete_all_hosted_apps(driver):
    try:
        tbody = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#apps-table tbody"))
        )
        delete_buttons = tbody.find_elements(By.XPATH, ".//button[contains(text(), 'Delete')]")
        for btn in delete_buttons:
            try:
                driver.execute_script("arguments[0].scrollIntoView(true);", btn)
                WebDriverWait(driver, 10).until(EC.element_to_be_clickable(btn))
                btn.click()
                WebDriverWait(driver, 10).until(EC.staleness_of(btn))
            except Exception as e:
                print("⚠️ Warning: could not click delete button or wait for deletion:", e)

        try:
            rows = tbody.find_elements(By.TAG_NAME, "tr")
            if len(rows) == 0:
                return True
            else:
                print(f"⚠️ Some rows remain after delete: {len(rows)}")
                return False
        except:
            return True
    except Exception as e:
        print("ℹ️ No hosted apps table found or empty:", e)
        return True

def attempt_signup(driver, email_val, password_val):
    try:
        email_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        password_field = driver.find_element(By.NAME, "password")
        try:
            confirm_field = driver.find_element(By.NAME, "confirm_password")
        except:
            confirm_field = None

        email_field.clear()
        email_field.send_keys(email_val)
        password_field.clear()
        password_field.send_keys(password_val)
        if confirm_field:
            confirm_field.clear()
            confirm_field.send_keys(password_val)

        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")))
        submit_btn.click()

        wait_for_full_load(driver)
        wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

        flash_divs = driver.find_elements(By.CSS_SELECTOR, ".flash")
        for div in flash_divs:
            text = div.text.strip().lower()
            if "email already registered" in text:
                print("✅ Detected proper error: email already registered.")
                return False

        current_url = driver.current_url.lower()
        if "login" in current_url or "dashboard" in current_url:
            return True
        if "register" in current_url or "signup" in current_url:
            return False

        return False
    except Exception as e:
        print("⚠️ Exception during signup attempt:", e)
        return False

# === Main Test Flow ===

options = Options()
options.binary_location = "/snap/firefox/6316/usr/lib/firefox/firefox"
driver = webdriver.Firefox(options=options)

try:
    driver.get("http://127.0.0.1:3000/")
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

    login_link = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.LINK_TEXT, "Login"))
    )
    login_link.click()
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

    print("🔗 Attempting primary login...")
    if attempt_login(driver, "missari@gmail.com", "12345"):
        print("✅ Primary login successful!")
    else:
        print("⚠️ Primary login failed; retrying with alternate credentials...")
        if not ("name=\"email\"" in driver.page_source and "name=\"password\"" in driver.page_source):
            driver.get("http://127.0.0.1:3000/login")
            wait_for_full_load(driver)
            wait_for_invisibility(driver, By.ID, "starfield", timeout=15)
        if attempt_login(driver, "car@gmail.com", "12345"):
            print("✅ Alternate login successful!")
        else:
            print("❌ Both login attempts failed. Exiting test.")
            driver.quit()
            sys.exit(1)

    print("🔗 Navigating to Upload Page for ZIP...")
    driver.get("http://127.0.0.1:3000/")
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

    print("🔗 Uploading ZIP...")
    upload_form = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "form[action='/upload_zip'], form[action*='upload']"))
    )
    zip_input = upload_form.find_element(By.NAME, "site_zip")
    zip_path = os.path.expanduser("~/Desktop/car.zip")
    zip_input.send_keys(zip_path)
    try:
        github_input = upload_form.find_element(By.NAME, "github_url")
        github_input.clear()
    except:
        pass

    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)
    upload_button = WebDriverWait(upload_form, 15).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='submit'], button[type='submit']"))
    )
    upload_button.click()

    print("🔗 Waiting for ZIP hosting result...")
    WebDriverWait(driver, 60).until(
        lambda d: "✅ Hosted:" in d.page_source or "App hosted successfully!" in d.page_source or 
                  (len(d.find_elements(By.CSS_SELECTOR, "#apps-table tbody tr")) >= 1)
    )
    print("✅ ZIP hosted (or detected in apps table).")

    print("🔗 Deleting hosted app(s) after ZIP...")
    driver.get("http://127.0.0.1:3000/")
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)
    if delete_all_hosted_apps(driver):
        print("✅ All ZIP-hosted apps deleted.")
    else:
        print("⚠️ Some ZIP-hosted apps may remain after deletion.")

    print("🔗 Uploading via GitHub URL...")
    driver.get("http://127.0.0.1:3000/")
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

    upload_form = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "form[action='/upload_zip'], form[action*='upload']"))
    )
    github_input = upload_form.find_element(By.NAME, "github_url")
    github_input.clear()
    github_input.send_keys("https://github.com/orangeuniversity/testing.git")
    try:
        zip_input = upload_form.find_element(By.NAME, "site_zip")
        zip_input.clear()
    except:
        pass

    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)
    upload_button = WebDriverWait(upload_form, 15).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='submit'], button[type='submit']"))
    )
    upload_button.click()

    print("🔗 Waiting for GitHub hosting result...")
    WebDriverWait(driver, 60).until(
        lambda d: "✅ Hosted:" in d.page_source or "App hosted successfully!" in d.page_source or 
                  (len(d.find_elements(By.CSS_SELECTOR, "#apps-table tbody tr")) >= 1)
    )
    print("✅ GitHub URL hosted (or detected in apps table).")

    print("🔗 Deleting hosted app(s) after GitHub URL...")
    driver.get("http://127.0.0.1:3000/")
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)
    if delete_all_hosted_apps(driver):
        print("✅ All GitHub-hosted apps deleted.")
    else:
        print("⚠️ Some GitHub-hosted apps may remain after deletion.")

    print("🔗 Logging out...")
    try:
        logout_link = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Logout"))
        )
        logout_link.click()
        wait_for_full_load(driver)
        wait_for_invisibility(driver, By.ID, "starfield", timeout=15)
        print("✅ Logged out.")
    except Exception as e:
        print("⚠️ Could not find or click Logout link:", e)

    print("🔗 Navigating to Register page...")
    try:
        register_link = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Register"))
        )
        register_link.click()
    except:
        driver.get("http://127.0.0.1:3000/register")
    wait_for_full_load(driver)
    wait_for_invisibility(driver, By.ID, "starfield", timeout=15)

    print("🔗 Attempting signup with existing email...")
    signup_result = attempt_signup(driver, "missariahil@gmail.com", "12345")
    if not signup_result:
        print("✅ Signup attempt correctly failed for existing user. Test flow complete.")
        driver.quit()
        sys.exit(0)
    else:
        print("❌ Unexpected: signup succeeded for an existing user! Test indicates a problem.")
        driver.quit()
        sys.exit(1)

finally:
    try:
        driver.quit()
    except:
        pass

