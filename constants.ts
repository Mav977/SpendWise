// Define colors for each category
export const categoryColors: { [key: string]: string } = {
  // Expense Categories
  "Doctor Visits": "#FF6347", // Tomato
  "Medicines": "#FFA07A",     // LightSalmon
  "Gym Membership": "#6A5ACD", // SlateBlue
  "Groceries": "#FFD700",     // Gold (kept from your original)
  "Restaurants": "#FF8C00",   // DarkOrange
  "Fast Food": "#CD5C5C",     // IndianRed
  "Public Transport": "#4682B4", // SteelBlue
  "Fuel": "#B22222",          // FireBrick
  "Cab Services": "#8A2BE2",  // BlueViolet
  "Movies & Subscriptions": "#9932CC", // DarkOrchid
  "Games": "#DA70D6",         // Orchid
  "Clothing": "#FF1493",      // DeepPink
  "Accessories": "#DB7093",   // PaleVioletRed
  "Electronics": "#00CED1",   // DarkTurquoise (kept from your original)
  "Furniture": "#8B4513",     // SaddleBrown
  "Books & Magazines": "#A0522D", // Sienna
  "Events & Concerts": "#FF4500", // OrangeRed
  "Education": "#483D8B",      // DarkSlateBlue
  "Subscriptions": "#7B68EE", // MediumSlateBlue
  "Charity": "#DC143C",       // Crimson
  "Gifts": "#FF69B4",         // HotPink (kept from your original)
  "Miscellaneous": "#808080", // Gray

  // Income Categories
  "Bonus": "#32CD32",          // LimeGreen (kept from your original for Salary/Bonus)
  "Consulting Work": "#6495ED", // CornflowerBlue (kept from your original for Freelancing/Consulting)
  "Part-time Job": "#20B2AA",  // LightSeaGreen
  "Online Sales": "#008080",   // Teal

  // Default fallback for any unmapped category
  Default: "#D3D3D3", // LightGray
};

// Define emojis for each category
export const categoryEmojies: { [key: string]: string } = {
  // Expense Categories
  "Doctor Visits": "🩺",
  "Medicines": "💊",
  "Gym Membership": "🏋️‍♂️",
  "Groceries": "🛒",
  "Restaurants": "🍽️",
  "Fast Food": "🍔",
  "Public Transport": "🚌",
  "Fuel": "⛽",
  "Cab Services": "🚕",
  "Movies & Subscriptions": "🎬",
  "Games": "🎮",
  "Clothing": "👕",
  "Accessories": "💍",
  "Electronics": "💻",
  "Furniture": "🛋️",
  "Books & Magazines": "📚",
  "Events & Concerts": "🎉",
  "Education": "🎓",
  "Subscriptions": "💳",
  "Charity": "❤️",
  "Gifts": "🎁",
  "Miscellaneous": "🤷‍♀️",

  // Income Categories
  "Bonus": "💰",
  "Consulting Work": "💼",
  "Part-time Job": "⏱️",
  "Online Sales": "🌐",

  // Default fallback for any unmapped category
  Default: "✨",
};