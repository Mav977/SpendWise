// Define colors for each category
export const categoryColors: { [key: string]: string } = {
  // Expense Categories
  "Medicines": "#FFA07A",     // LightSalmon
  "Gym": "#6A5ACD", // SlateBlue
  "Groceries": "#FFD700",     // Gold
  "Restaurants": "#FF8C00",   // DarkOrange
  "Food": "#CD5C5C",     // IndianRed
  "Transport": "#4682B4", // SteelBlue
  "Fuel": "#B22222",          // FireBrick
  "Subscriptions": "#9932CC", // DarkOrchid
  "Clothing": "#FF1493",      // DeepPink
  "Accessories": "#DB7093",   // PaleVioletRed
  "Education": "#483D8B",      // DarkSlateBlue
  "Gifts": "#FF69B4",         // HotPink
  "Miscellaneous": "#808080", // Gray
  "General Store": "#00987d",
  "Home Accessories": "#ffb6c1",
  // Income Categories
  "Bonus": "#32CD32",          // LimeGreen
  "Consulting Work": "#6495ED", // CornflowerBlue
  "Part-time Job": "#20B2AA",  // LightSeaGreen
  "Online Sales": "#008080",   // Teal

  // Default fallback for any unmapped category
  Default: "#D3D3D3", // LightGray
};

// Define emojis for each category
export const categoryEmojies: { [key: string]: string } = {
  // Expense Categories
  "Medicines": "💊",
  "Gym": "🏋️‍♂️",
  "Groceries": "🛒",
  "Restaurants": "🍽️",
  "Food": "🍔",
  "Transport": "🚌",
  "Fuel": "⛽",
  "Subscriptions": "💳",
  "Clothing": "👕",
  "Accessories": "💍",
  "Education": "🎓",
  "Gifts": "🎁",
  "Miscellaneous": "🤷‍♀️",
  "General Store": "🛒",
  "Home Accessories": "🛋️",

  // Income Categories
  "Bonus": "💰",
  "Consulting Work": "💼",
  "Part-time Job": "⏱️",
  "Online Sales": "🌐",
  
  // Default fallback for any unmapped category
  Default: "✨",
};
