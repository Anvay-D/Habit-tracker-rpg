export const TITLES = [
  { minXP: 0, maxXP: 99, title: "E-Rank Hunter", rank: "E" },
  { minXP: 100, maxXP: 299, title: "D-Rank Hunter", rank: "D" },
  { minXP: 300, maxXP: 699, title: "C-Rank Hunter", rank: "C" },
  { minXP: 700, maxXP: 1499, title: "B-Rank Hunter", rank: "B" },
  { minXP: 1500, maxXP: 2999, title: "A-Rank Hunter", rank: "A" },
  { minXP: 3000, maxXP: 5999, title: "S-Rank Hunter", rank: "S" },
  { minXP: 6000, maxXP: 9999, title: "Shadow Monarch", rank: "SS" },
  { minXP: 10000, maxXP: Infinity, title: "King of the Dead", rank: "SSS" }
];

export class TitleSystem {
  static getTitle(totalXP) {
    return TITLES.find(t => totalXP >= t.minXP && totalXP <= t.maxXP);
  }

  static getNextTitle(currentXP) {
    const currentTitle = this.getTitle(currentXP);
    const currentIndex = TITLES.indexOf(currentTitle);
    return currentIndex < TITLES.length - 1 ? TITLES[currentIndex + 1] : null;
  }

  static getProgressToNext(currentXP) {
    const currentTitle = this.getTitle(currentXP);
    const nextTitle = this.getNextTitle(currentXP);

    if (!nextTitle) {
      return { percentage: 100, xpNeeded: 0 };
    }

    const xpInCurrentRank = currentXP - currentTitle.minXP;
    const xpForNextRank = nextTitle.minXP - currentTitle.minXP;
    const percentage = Math.floor((xpInCurrentRank / xpForNextRank) * 100);
    const xpNeeded = nextTitle.minXP - currentXP;

    return { percentage, xpNeeded };
  }
}