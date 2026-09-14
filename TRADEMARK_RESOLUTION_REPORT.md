# Google Play Trademark Infringement Resolution Report
**App:** Number Link Puzzle (formerly Number Flow: Connect Puzzle)  
**Package Name:** `com.numberflow.game`  
**Date:** September 14, 2026  
**Developer:** NP Game Studio (`npgamestudio1@gmail.com`)  
**Dispute Reference:** Big Duck Games, LLC — Registered Trademark "FLOW" (U.S. Reg. Nos. 4395937 & 5169157)  

---

## 1. Summary of Changes Made in the Project

| Item | Old Value | New Value | File(s) |
|---|---|---|---|
| **App Display Name** | Number Flow | **Number Link Puzzle** | `app.json`, `strings.xml` |
| **Android Version Code** | 6 | **7** | `android/app/build.gradle` |
| **Android Version Name** | 1.5 | **1.6** | `android/app/build.gradle` |
| **Package Name** | `com.numberflow.game` | `com.numberflow.game` *(Preserved to retain all user downloads, reviews & ranking)* | `build.gradle`, `AndroidManifest.xml` |
| **App Launcher Icon** | Legacy icon with "NF" lettering | Modern glowing 1-2-3 connected nodes (No "NF", zero trademark risk) | `res/mipmap-*/ic_launcher.png`, `play_store_512.png` |
| **Home Screen** | NUMBER FLOW | **NUMBER LINK PUZZLE** *(Original Shop, Game & Reward tiles preserved)* | `src/screens/HomeScreen.jsx` |
| **Profile Screen** | Share Number Flow | **Share Number Link Puzzle** | `src/screens/ProfileScreen.jsx` |
| **In-Game Modals** | Welcome to Number Flow | Welcome to Number Link Puzzle | `src/components/*.jsx` |
| **Website & Policy** | Number Flow | Number Link Puzzle | `website/index.html`, `website/privacy-policy.html` |

---

## 2. Google Play Store Listing Data (Copy & Paste)

Go to **Google Play Console** > **Your App** > **Grow** > **Store presence** > **Main store listing**.

### App Title (Max 30 characters)
```text
Number Link Puzzle
```

### Short Description (Max 80 characters)
```text
Connect matching numbers with lines to solve fun, logic-driven path puzzles!
```

### Full Description
```text
Welcome to Number Link Puzzle — a captivating, clean, and satisfying logic puzzle game designed to sharpen your mind!

Connect pairs of matching numbers across the grid by drawing uninterrupted paths. Fill the entire board without overlapping lines to clear each level. With intuitive touch controls, sleek dark mode visuals, and smooth haptic feedback, Number Link Puzzle delivers an experience that is both deeply relaxing and mentally rewarding.

FEATURES:
• THOUSANDS OF ENGAGING LEVELS: Progress from quick 5x5 starter grids to challenging complex boards.
• DAILY REWARDS & LUCKY WHEEL: Spin the wheel daily to earn bonus coins and handy hints.
• COIN SHOP & POWER-UPS: Unlock helpful hints to guide you whenever you encounter tricky puzzles.
• PURE LOGIC GAMEPLAY: No timers or high-pressure countdowns — solve at your own comfortable pace.
• OFFLINE FRIENDLY: Play anytime, anywhere without requiring an active internet connection.
• CLEAN & SLEEK AESTHETIC: Vibrant neon color scheme with smooth animations and satisfying touch effects.

Whether you have two minutes to spare or want to immerse yourself in an extended logic session, Number Link Puzzle is your ultimate brain-training companion.

Download Number Link Puzzle today and connect your way to victory!
```

### High-Res App Icon (512x512 PNG)
- Path: `android/app/src/main/res/play_store_512.png` (also saved at `play_store_512.png` in project root)

### Feature Graphic Banner (1024x500 PNG - Play Store Specification)
- Google Play requirement: Exactly 1024 x 500 px
- Path: `screenImages/banner/play_store_feature_graphic_1024x500.png` (also copied to `play_store_feature_graphic_1024x500.png` in project root)

### Phone Screenshots (9:16 Ratio - 1080x1920 PNG)
Folder: `screenImages/portrait_9_16/`
1. `screenshot_1_home_1080x1920.png` — Home Screen & NLP Logo
2. `screenshot_2_gameplay_1080x1920.png` — Gameplay Level 6 Board
3. `screenshot_3_spinwheel_1080x1920.png` — Daily Lucky Wheel
4. `screenshot_4_profile_1080x1920.png` — Player Profile & XP
5. `screenshot_5_shop_1080x1920.png` — Coin Shop & Power-ups

### Tablet / Chromebook Screenshots (16:9 Ratio - 1920x1080 PNG)
Folder: `screenImages/landscape_16_9/`
1. `screenshot_1_gameplay_1920x1080.png` — Gameplay Showcase
2. `screenshot_2_home_1920x1080.png` — Minimal Cyber Dark Aesthetics
3. `screenshot_3_spin_1920x1080.png` — Daily Spins & Rewards
4. `screenshot_4_profile_1920x1080.png` — Player Milestones & Stats
5. `screenshot_5_shop_1920x1080.png` — Shop & Instant Hints

---

## 3. Email Template to Big Duck Games' Attorney

Send this email to: **`tom@smcarthurlaw.com`**  
Subject: **`Trademark Notice Resolution - App 'Number Link Puzzle' (com.numberflow.game)`**

```text
Dear Mr. McArthur,

I am writing on behalf of NP Game Studio regarding the trademark notice forwarded by Google Play concerning Big Duck Games LLC's registered trademark "FLOW" (U.S. Reg. Nos. 4395937 and 5169157) in relation to the application com.numberflow.game.

We take intellectual property rights very seriously. Immediately upon receipt of this notice, we took comprehensive corrective action to completely eliminate any potential confusion with your client's registered mark:

1. App Title Rebranding: The application title has been changed from "Number Flow: Connect Puzzle" to "Number Link Puzzle".
2. Store Listing Metadata: All store listings, titles, short descriptions, and long descriptions on Google Play have been scrubbed of any use of the word "Flow".
3. In-App UI & Branding: All in-game screens, headers, game modes, modal dialogs, and share texts have been fully updated to remove any reference to "Flow".
4. App Icon & Visual Assets: The application icon has been replaced with a brand-new design that completely removes the prior "NF" branding.
5. New Release Submitted: An updated production release (Version 1.6, Version Code 7) reflecting these changes has been submitted to the Google Play Console for review.

Given that the mark "FLOW" has been entirely removed from all consumer-facing branding and assets, we respectfully request that you reply to Google's complaint confirmation email to withdraw the complaint, or provide written confirmation that Big Duck Games LLC considers this matter resolved.

Thank you for your time and cooperation.

Sincerely,
NP Game Studio
Contact Email: npgamestudio1@gmail.com
```

---

## 4. Google Play Console Appeal / Policy Status Response

Go to **Google Play Console** > **Policy and programs** > **Policy status** (or directly reply to Google's notification email):

```text
Dear Google Play Support Team,

In response to the Trademark Infringement notice received regarding the mark "FLOW" (U.S. Reg. Nos. 4395937 and 5169157) for application com.numberflow.game:

We have taken immediate, complete corrective action to eliminate all potential confusion with the cited mark, well within the 7-day resolution period:

1. Rebranded App Title: The public-facing app title has been changed from "Number Flow: Connect Puzzle" to "Number Link Puzzle".
2. Store Listing Updated: The app title, short description, and full description have been updated to completely remove any occurrence of the word "Flow".
3. Visual Branding & Icon Updated: The launcher icon has been replaced with a new icon that eliminates any prior "NF" branding.
4. In-App Branding: All in-game screens, UI text, mode titles, and share messages have been updated to remove any reference to "Flow".
5. App Update Submitted: A new release bundle (versionCode 7, versionName 1.6) containing all the updated branding has been uploaded and submitted for review.
6. Complainant Contacted: We have reached out directly to the complainant's legal counsel (tom@smcarthurlaw.com) informing them of these complete modifications.

We kindly request confirmation that our app is in full compliance with Google Play's Trademark Infringement policy.

Sincerely,
NP Game Studio
```

---

## 5. Next Steps Checklist

- [ ] **Step 1: Build the Release Bundle (.aab)**
  Open your terminal and run:
  ```cmd
  cd android
  gradlew bundleRelease
  ```
  *Output file location:* `android/app/build/outputs/bundle/release/app-release.aab`

- [ ] **Step 2: Upload to Google Play Console**
  - Go to **Production** (or Open testing) > **Create new release**.
  - Upload `app-release.aab` (Version 1.6, Code 7).
  - Release notes:
    ```text
    - Rebranded to Number Link Puzzle
    - UI and performance improvements
    - Bug fixes and stability enhancements
    ```
  - Click **Save** and **Review & roll out**.

- [ ] **Step 3: Update Store Listing**
  - Update App Name, Short Description, Full Description, and App Icon (`play_store_512.png`).
  - Submit changes for review.

- [ ] **Step 4: Send the Email to Attorney**
  - Email `tom@smcarthurlaw.com` using the template in Section 3 above.

- [ ] **Step 5: Submit Response in Google Play Console**
  - Post the response message from Section 4 under Policy Status / Appeal.

- [ ] **Step 6: Upload Play Store Graphics & Screenshots**
  - **Feature Graphic (1024x500):** Upload `play_store_feature_graphic_1024x500.png`.
  - **Phone Screenshots (9:16):** Upload all 5 images from `screenImages/portrait_9_16/`.
  - **Tablet Screenshots (16:9):** Upload the 5 images from `screenImages/landscape_16_9/`.
