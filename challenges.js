class ChallengeManager {
  constructor() {
    this.challenges = {
      1: {
        id: 1,
        title: "Exercise 1: Basic Connected City",
        description: "Build a city with 3 houses and 1 hospital that is fully connected.",
        hint: "🏠---🏠---🏠---🏥",
        solution: "Every house should have access to the hospital.",
        type: "exercise",
        difficulty: "easy"
      },
      2: {
        id: 2,
        title: "Exercise 2: Disconnected City",
        description: "Create a city with 2 separate regions that are not connected.",
        hint: "Region A: 🏠---🏥  Region B: 🏫---🛒",
        solution: "No connections between regions.",
        type: "exercise",
        difficulty: "easy"
      },
      3: {
        id: 3,
        title: "Exercise 3: Earthquake & Bridge Failure",
        description: "Build a connected city where removing one bridge disconnects it.",
        hint: "🏠---[Bridge]---🏥---🏫",
        solution: "Identify critical bridges.",
        type: "exercise",
        difficulty: "medium"
      },
      4: {
        id: 4,
        title: "Challenge 1: Shortest Network",
        description: "Connect 5 houses with the minimum number of roads.",
        hint: "n points can be connected with n-1 edges!",
        solution: "Maximum 4 connections.",
        type: "challenge",
        difficulty: "medium"
      },
      5: {
        id: 5,
        title: "Challenge 2: Resilient City",
        description: "Build a city where removing any single road doesn't disconnect it.",
        hint: "Create redundant paths for increased reliability.",
        solution: "No vulnerable connections.",
        type: "challenge",
        difficulty: "hard"
      }
    };

    this.completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '[]');
  }

  getChallenge(id) {
    return this.challenges[id];
  }

  getAllChallenges() {
    return Object.values(this.challenges);
  }

  completeChallenge(id) {
    if (!this.completedChallenges.includes(id)) {
      this.completedChallenges.push(id);
      this.saveProgress();
      return true;
    }
    return false;
  }

  isChallengeCompleted(id) {
    return this.completedChallenges.includes(id);
  }

  getProgress() {
    const total = Object.keys(this.challenges).length;
    const completed = this.completedChallenges.length;
    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100)
    };
  }

  saveProgress() {
    localStorage.setItem('completedChallenges', JSON.stringify(this.completedChallenges));
  }

  resetProgress() {
    this.completedChallenges = [];
    localStorage.setItem('completedChallenges', JSON.stringify([]));
  }

  getEducationalTip(challengeId) {
    const challenge = this.getChallenge(challengeId);
    if (!challenge) return "";

    const tips = {
      1: "In a connected city, you can travel from any point to any other point. This concept in mathematics is called 'connectivity'.",
      2: "A disconnected city can be divided into two separate subsets with no paths between them.",
      3: "Some connections are 'critical' and removing them disconnects the city. In graph theory, these are called 'bridges'.",
      4: "The minimum number of connections to connect n points is n-1. This is a property of trees in graph theory.",
      5: "A graph where removing any edge doesn't disconnect it is called '2-edge-connected' and has higher resilience."
    };

    return tips[challengeId] || "This challenge teaches basic connectivity concepts in topology and graph theory.";
  }
}

// Create ChallengeManager instance
const challengeManager = new ChallengeManager();

// Add to window for console access
window.challengeManager = challengeManager;
