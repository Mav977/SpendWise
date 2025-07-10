import { AppRegistry, DeviceEventEmitter } from "react-native";
import * as SQLite from "expo-sqlite";
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { getDB } from "../../db";

let lastTimestamp = 0;
async function sendNotif(receiver:string, amount:number, alwaysAsk: number) {
   const deepLink = Linking.createURL(`/categorise?receiver=${encodeURIComponent(receiver)}&amount=${amount}&alwaysask=${alwaysAsk}`);

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
const handleNotification = async (notification: any) => {
  try {
    const parsed = JSON.parse(notification.notification);
    const now = Date.now();

    // Skip if same message came within 3 seconds
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

    const isLikelyUPI = isAmountPresent && hasBankClue;

    if (!isLikelyUPI) {
      console.log("🛑 Not a likely UPI transaction");
      return;
    }

    const pattern = /₹\s*([\d,]+(?:\.\d{1,2})?)\s*•\s*(.*?)\s*•\s*(.*)/i;

    const type = "Expense";

    const match = fullMessage.match(pattern);

    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      const receiver = match[3];
      console.log(fullMessage);
      console.log("✅ Parsed:");
      console.log("Amount:", amount);
      console.log("Receiver:", receiver);
      // db logic
      try {
        
      } catch (error) {
        
      }
      const db = await getDB();

      await db.withTransactionAsync(async () => {
        const rows = await db.getAllAsync(
          "SELECT * FROM UPICategory WHERE receiver = ?",
          [receiver]
        );
        
        
        if (rows.length > 0) {
          //@ts-ignore
          const ask = rows[0].alwaysAsk; 
          console.log("📂 Receiver already categorized:", rows[0]);
          const findId = await db.getAllAsync<{ id: number }>(
            "SELECT id FROM Categories WHERE name = ?",
            //@ts-ignore
            [rows[0].category]
          );
          const category_id = findId[0].id;
          
          
          if ( ask=== 0) {
            const date = new Date().getTime();
             //@ts-ignore
            const description = rows[0].description;
            await db.runAsync(
              `INSERT INTO Transactions (category_id, amount, date, description, type)
     VALUES (?, ?, ?, ?, ?)`,
              [category_id, amount, date, description, type]
            );
            console.log("💾 Auto-inserted transaction for", receiver);
            DeviceEventEmitter.emit("transactionInserted");
            console.log("📢 Emitted event: transactionInserted");
          }
          else{
            sendNotif(receiver,amount,ask);
          }
        } else {
          sendNotif(receiver,amount,0);
        }
      });
    }
  } catch (err) {
    console.error("❌ Error parsing notification", err);
  }
};

AppRegistry.registerHeadlessTask(
  "RNAndroidNotificationListenerHeadlessJs",
  () => handleNotification
);
