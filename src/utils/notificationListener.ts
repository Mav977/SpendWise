import { AppRegistry, DeviceEventEmitter } from "react-native";
import * as SQLite from "expo-sqlite";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { getDB } from "../../db";
import { fetchAi } from "./fetchAI";
import { Category, UPICategory } from "../../types";
import { addCategory } from "../db/addCategory";

let lastTimestamp = 0;

// 🔹 Send deep link notification
async function sendNotif(receiver: string, amount: number, alwaysAsk: number, transactionId: number) {
  const deepLink = Linking.createURL(
    `/categorise?receiver=${encodeURIComponent(receiver)}&amount=${amount}&alwaysask=${alwaysAsk}&transactionId=${transactionId}`
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New UPI Receiver",
      body: `Add category for ${receiver}`,
      data: { deepLink },
    },
    trigger: null,
  });

  console.log("🔔 Notification scheduled with deep link:", deepLink);
}
async function addPendingTransaction(
  db: SQLite.SQLiteDatabase,
  amount: number,
  date: number,
  receiver: string
) : Promise<number>{
    const result = await db.runAsync(
    `INSERT INTO Transactions (category_id, amount, date, description, type, pending_cat)
     VALUES (?, ?, ?, ?, ?, 1)`, 
     //40 is 'miscellaneous' category ID, I put receiver as description intentionally
    [40, amount, date, receiver, "Expense"]
  );
  // result.lastInsertRowId contains the new transaction's ID
  return result.lastInsertRowId;
}
async function autoSave({
  db,
  receiver,
  amount,
  category,
  description,
  type,
}: {
  db: SQLite.SQLiteDatabase;
  receiver: string;
  amount: number;
  category: string;
  description: string;
  type: "Expense" | "Income";
}) {
  const date = Date.now();
  const findId = await db.getAllAsync<{ id: number }>(
    "SELECT id FROM Categories WHERE name = ?",
    [category]
  );

  if (findId.length === 0) {
    console.warn("⚠️ Category not found for", category);
    return;
  }

  const category_id = findId[0].id;

  await db.runAsync(
    `INSERT INTO Transactions (category_id, amount, date, description, type, pending_cat)
     VALUES (?, ?, ?, ?, ?, 0)`,// Insert transaction with pending_cat set to 0
    [category_id, amount, date, description, type]
  );

  console.log("💾 Auto-inserted transaction for", receiver);
  DeviceEventEmitter.emit("transactionInserted");
  console.log("📢 Emitted event: transactionInserted");
    await Notifications.scheduleNotificationAsync({
    content: {
      title: "Auto-inserted transaction",
      body: `for ${receiver}`
      
    },
    trigger: null,
  });
}

const handleNotification = async (notification: any) => {
  try {
    const parsed = JSON.parse(notification.notification);
    const now = Date.now();

    // Avoid duplicate spam
    if (now - lastTimestamp < 3000) {
      console.log("Duplicate notification skipped");
      return;
    }

    lastTimestamp = now;
    const fullMessage = `${parsed.title} ${parsed.text}`.toLowerCase();

    const isAmountPresent =
      /₹\s?([\d,]+\.\d{2}|\d+)|inr\s?([\d,]+\.\d{2}|\d+)/i.test(fullMessage);
    const hasBankClue =
      fullMessage.includes("bank") ||
      fullMessage.includes("axis") ||
      fullMessage.includes("icici") ||
      fullMessage.includes("a/c") ||
      fullMessage.includes("account");

    if (!(isAmountPresent && hasBankClue)) {
      console.log("🛑 Not a likely UPI transaction");
      return;
    }

    const pattern = /₹\s*([\d,]+(?:\.\d{1,2})?)\s*•\s*(.*?)\s*•\s*(.*)/i;
    const match = fullMessage.match(pattern);
    if (!match) return;

    const amount = parseFloat(match[1].replace(/,/g, ""));
    const receiver = match[3];
  
    // const hasUPIclue = fullMessage.includes("upi") || fullMessage.includes("UPI");
    // if(!hasUPIclue) {
    //   console.log("🛑 Not a likely UPI transaction");
    //   return;
    // }
    console.log("✅ Parsed Amount:", amount, "| Receiver:", receiver);
    const tosendAI = `₹ ${amount},${receiver}`;
    const db = await getDB();

    await db.withTransactionAsync(async () => {
      const rows = await db.getAllAsync(
        "SELECT * FROM UPICategory WHERE receiver = ?",
        [receiver]
      );

      if (rows.length > 0) {
        
        const row = rows[0];
        //@ts-ignore
        const ask = row.alwaysAsk;
        //@ts-ignore
        const type = row.type;
        //@ts-ignore
        const description = row.description;
        //@ts-ignore
        const category = row.category;

        console.log("📂 Receiver already categorized:", row);

        if (ask === 0) {
          await autoSave({ db, receiver, amount, category, description, type });
        } else {
          const transactionId = await addPendingTransaction(db, amount, Date.now(), receiver);
await sendNotif(receiver, amount, ask, transactionId);

        }
      } else {
        const cat: Category[] = await db.getAllAsync(
          "SELECT * FROM Categories"
        );
        const categoryNames = cat.map((item) => item.name);

        const ai = await fetchAi(tosendAI, categoryNames);
        console.log("This is ai ", ai);
        if (!ai || !ai.category) {
          console.warn("Ai is not available");
          const transactionId = await addPendingTransaction(db, amount, Date.now(), receiver);
await sendNotif(receiver, amount, 0, transactionId);

          return;
        }
        const category = ai.category;
        const description = ai.description;
       
        const type = ai.type;
        const upi = await db.getAllAsync<UPICategory>(
          "SELECT * FROM UPICategory WHERE LOWER(description) = LOWER(?)",
          [description]
        );
        if (upi.length > 0) {
          const upiCat=upi[0];
           await db.runAsync(
            `UPDATE UPICategory
             SET receiver = ?, category = ?, description = ?, alwaysAsk = ?, type = ?
             WHERE id = ?`,
            [receiver,        // The new receiver from the notification
              upiCat.category,   // Keep existing category from upiCat
              upiCat.description, // Keep existing description from upiCat
              upiCat.alwaysAsk,  // Keep existing alwaysAsk from upiCat
              upiCat.type,       // Keep existing type from upiCat
              upiCat.id          // ID of the row to update
            ]
          );
          console.log(" Matched AI description to existing UPICategory, updated receiver & details:", receiver, description);
          await autoSave({ db, receiver, amount, category, description, type });
        } else {
          if (
            Number(ai.confidence_score) >= 9 &&
            category.toLowerCase() != "unknown" &&
            description.toLowerCase() != "unknown" &&
            type.toLowerCase() != "unknown"
          ) {
            if (
              cat.some(
                (c) => c.name.toLowerCase() === ai.category.toLowerCase()
              )
            ) {
              await autoSave({
                db,
                receiver,
                amount,
                category,
                description,
                type,
              });
              await db.runAsync(
                `INSERT INTO UPICategory (receiver, category, description, alwaysAsk, type)
       VALUES (?, ?, ?, ?, ?)`,
                [receiver, category, description, 0, type]
              );
            } else if (Number(ai.confidence_score) >= 9.5) {
              //add category
              console.log("🔧 Going to add new category:", ai.category);
              await addCategory(db, ai.category, ai.type, () => {});
              console.log("🔧 Added new category:", ai.category);
              await autoSave({
                db,
                receiver,
                amount,
                category,
                description,
                type,
              });
              await db.runAsync(
                `INSERT INTO UPICategory (receiver, category, description, alwaysAsk, type)
       VALUES (?, ?, ?, ?, ?)`,
                [receiver, category, description, 0, type]
              );
            }
          } else {
            const transactionId = await addPendingTransaction(db, amount, Date.now(), receiver);
            await sendNotif(receiver, amount, 0, transactionId);

          }
        }
      }
    });
  } catch (err) {
    console.error("❌ Error parsing notification", err);
  }
};

AppRegistry.registerHeadlessTask(
  "RNAndroidNotificationListenerHeadlessJs",
  () => handleNotification
);