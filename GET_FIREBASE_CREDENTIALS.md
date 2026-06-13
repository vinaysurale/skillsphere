# 🔥 How to Get Firebase Service Account Credentials

## Step 1: Download Firebase Service Account JSON

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Select your project: **skillsphere-aa420**
3. Click the ⚙️ **Settings** icon (top left) → **Project settings**
4. Click on the **Service accounts** tab
5. Click **Generate new private key** button
6. Click **Generate key** in the popup
7. A JSON file will download (e.g., `skillsphere-aa420-firebase-adminsdk-xxxxx.json`)

---

## Step 2: Format for .env File

Once you download the JSON file, you need to:

### Option A: Minify to Single Line (For .env)

1. Open the downloaded JSON file
2. Copy ALL the content
3. Go to **[JSON Minifier](https://codebeautify.org/jsonminifier)**
4. Paste and click "Minify"
5. Copy the minified single-line result

**Example of what you'll get:**

```
{"type":"service_account","project_id":"skillsphere-aa420","private_key_id":"abc123xyz","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@skillsphere-aa420.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40skillsphere-aa420.iam.gserviceaccount.com"}
```

### Option B: Use as File (Recommended for Local Development)

1. Save the downloaded file as `firebase-service-account.json` in your project root
2. Update `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

**Note:** The file is already in `.gitignore`, so it won't be committed to Git.

---

## Step 3: Update Your .env File

### If using minified JSON (Option A):

Replace this line in `.env`:
```env
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

With the actual minified JSON:
```env
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"skillsphere-aa420","private_key_id":"abc123xyz","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQI...","client_email":"firebase-adminsdk@..."}
```

### If using file path (Option B - Recommended):

Add this line to `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

And remove or comment out:
```env
# FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

---

## Step 4: Verify It Works

Run your application:
```bash
uvicorn app.main:app --reload
```

Look for this in the logs:
```
✅ Firebase Admin SDK initialized using FIREBASE_CREDENTIALS_JSON.
```
OR
```
✅ Firebase Admin SDK initialized using file: firebase-service-account.json
```

---

## 🔐 Security Important

### For Local Development (.env):
- ✅ Use `FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json`
- ✅ Keep `firebase-service-account.json` file (already in .gitignore)
- ❌ Never commit the JSON file to Git

### For Render Deployment:
Use **Secret Files** instead of environment variable:

1. Render Dashboard → Your Service → Environment
2. Scroll to **Secret Files**
3. Add Secret File:
   - **Filename:** `firebase-service-account.json`
   - **Contents:** Paste the **full formatted JSON** (not minified)
4. Add environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase-service-account.json
   ```

---

## 📋 What Your Firebase JSON Contains

The service account JSON has these important fields:

```json
{
  "type": "service_account",
  "project_id": "skillsphere-aa420",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@skillsphere-aa420.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Important:** The `private_key` field contains `\n` (newline characters). Keep them as-is!

---

## ❓ Troubleshooting

### Issue: Can't find "Service accounts" tab
**Solution:** Make sure you're in **Project Settings** (⚙️ icon), not User Settings

### Issue: No "Generate new private key" button
**Solution:** You need Owner or Editor permissions on the Firebase project

### Issue: JSON parsing error
**Solution:** 
- Make sure you copied the entire JSON
- Don't add extra quotes around it
- Use the file path method instead (Option B)

### Issue: Still getting Firebase initialization error
**Solution:**
1. Delete the old key and generate a new one
2. Use the file path method (easier and less error-prone)
3. Make sure Firebase Realtime Database is enabled in Firebase Console

---

## ✅ Quick Start (Recommended Approach)

```bash
# 1. Download the JSON file from Firebase Console
# Save it as: firebase-service-account.json in project root

# 2. Update .env file
echo "FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json" >> .env

# 3. Test it
uvicorn app.main:app --reload

# 4. Check logs for: "Firebase Admin SDK initialized"
```

---

## 🚀 For Render Deployment

After getting the JSON file locally, upload it as a **Secret File** in Render:

1. Copy the content of `firebase-service-account.json`
2. Render Dashboard → Environment → Secret Files
3. Filename: `firebase-service-account.json`
4. Contents: Paste the JSON
5. Add env var: `FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase-service-account.json`
6. Remove `FIREBASE_CREDENTIALS_JSON` from Render environment

This is the cleanest and most secure approach!

---

**Need the JSON file?** Follow Step 1 above to download it from Firebase Console.
