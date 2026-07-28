import { v4 as uuidv4 } from 'uuid';

export const ITEM_TEMPLATES = [
  // Common Items
  { name: "Health Potion", rarity: "common", baseXP: 100, description: "+10 HP" },
  { name: "Mana Crystal", rarity: "common", baseXP: 100, description: "+5 MP" },
  { name: "Stamina Elixir", rarity: "common", baseXP: 100, description: "-5 Fatigue" },

  // Uncommon Items
  { name: "Enchanted Ring", rarity: "uncommon", baseXP: 300, description: "+5% XP Boost" },
  { name: "Shadow Cloak", rarity: "uncommon", baseXP: 300, description: "+2 Streak Protection" },
  { name: "Hunter's Badge", rarity: "uncommon", baseXP: 300, description: "Unlock new title color" },

  // Rare Items
  { name: "Demon King's Fragment", rarity: "rare", baseXP: 750, description: "+25% XP on next 5 quests" },
  { name: "Sung Jin-Woo's Dagger", rarity: "rare", baseXP: 750, description: "Auto-complete 1 daily quest" },
  { name: "System Key", rarity: "rare", baseXP: 750, description: "Unlock hidden achievement" },

  // Epic Items
  { name: "Necromancer's Crown", rarity: "epic", baseXP: 1500, description: "Double XP for 24 hours" },
  { name: "Gate Key", rarity: "epic", baseXP: 1500, description: "Create custom quest" },

  // Legendary Items
  { name: "Monarch's Authority", rarity: "legendary", baseXP: 3000, description: "Permanent +10% XP multiplier" },
  { name: "Shadow Army Seal", rarity: "legendary", baseXP: 3000, description: "Unlock all titles" }
];

export class Item {
  constructor(template, multiplier = 1) {
    this.id = uuidv4();
    this.name = template.name;
    this.rarity = template.rarity;
    this.description = template.description;
    this.xpRequired = Math.floor(template.baseXP * multiplier);
    this.dateEarned = null;
  }

  static generateForOverachievement(overAmount, baseXP) {
    const multiplier = Math.max(1, Math.floor(overAmount / 10));
    const eligibleItems = ITEM_TEMPLATES.filter(
      item => item.baseXP <= baseXP * multiplier * 2
    );

    if (eligibleItems.length === 0) return null;

    const randomItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
    const item = new Item(randomItem, multiplier);
    item.dateEarned = new Date();
    return item;
  }
}