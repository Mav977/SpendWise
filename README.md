# 💸 Spendwise – Smarter, Seamless Expense Tracking
![GitHub all releases](https://img.shields.io/github/downloads/Mav977/SpendWise/total)

Spendwise is not just another expense tracker — it's a **smarter, AI-powered UPI-aware expense manager** that works *quietly in the background*. You don’t even need to open the app every day — it automatically detects and logs your UPI transactions, and only notifies you when it needs your input. Designed for a seamless and minimal-effort experience.

---

## 🚀 Why I Built This

Last semester, I found myself forgetting to track expenses — especially UPI payments. I needed an app that *just worked*, without constant manual inputs. So this break, I decided to build **Spendwise** — a personal project that automates my spending logs and gives me useful analytics.

I’ll be using it in college next semester — and maybe you’ll find it useful too!

---

## ✨ Features

- 📊 **Dashboard**: Clean summary of monthly spending
- 💵 **Manual Cash Entry**: For offline/cash expenses
- 📈 **Analytics Screen**: View category-wise breakdown of expenses
- 🤖 **Automatic UPI SMS Detection**:
  - Reads SMS in the background
  - Detects UPI transactions and inserts them automatically
- 🧠 **AI Categorization**:
  - If confident, categorizes UPI transactions on its own
  - If not, triggers a notification for manual categorization
- 🔁 **“Always Ask” Toggle**: For flexible businesses like Amazon
- 🔄 **Edit / Delete / Flip Income-Expense**: Modify transactions anytime
- 🗃️ **Offline-First**: All data is stored in a local SQLite database

---

## 🛠 Tech Stack

### 📱 Frontend:
- **React Native**
- **TypeScript**
- **Expo**
- **SQLite (expo-sqlite)**
- **Deep Linking + Notifications + Permissions**

### 🧠 Backend:
- **Python**
- **FastAPI**
- **Gemini API** (for UPI merchant AI categorization)

<img width="1892" height="1051" alt="image" src="https://github.com/user-attachments/assets/6f538d7f-6785-40c9-8261-e489262983b6" />
