class CityGraph {
  constructor() {
    this.buildings = [];
    this.connections = [];
    this.graph = new Map();
    this.threshold = 100; // pixels
    this.activeChallenge = null;
    this.completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '[]');
  }

  // Building management
  addBuilding(type, x, y) {
    const building = {
      id: `b${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      x: x,
      y: y,
      emoji: this.getEmojiForType(type),
      label: this.getLabelForType(type),
      color: this.getColorForType(type)
    };

    this.buildings.push(building);
    this.updateGraph();
    return building;
  }

  removeBuilding(buildingId) {
    this.buildings = this.buildings.filter(b => b.id !== buildingId);
    this.connections = this.connections.filter(c =>
      c.from !== buildingId && c.to !== buildingId
    );
    this.updateGraph();
  }

  getBuildingAt(x, y, radius = 25) {
    for (const building of this.buildings) {
      const distance = Math.sqrt(
        Math.pow(building.x - x, 2) + Math.pow(building.y - y, 2)
      );
      if (distance <= radius) {
        return building;
      }
    }
    return null;
  }

  // Connection management
  addConnection(fromId, toId, type = 'road') {
    // Check for duplicate connection
    const exists = this.connections.some(c =>
      (c.from === fromId && c.to === toId) ||
      (c.from === toId && c.to === fromId)
    );

    if (exists) return null;

    const connection = {
      id: `c${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromId,
      to: toId,
      type: type,
      style: this.getStyleForConnection(type)
    };

    this.connections.push(connection);
    this.updateGraph();
    return connection;
  }

  removeConnection(connectionId) {
    this.connections = this.connections.filter(c => c.id !== connectionId);
    this.updateGraph();
  }

  removeConnectionBetween(fromId, toId) {
    this.connections = this.connections.filter(c =>
      !((c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId))
    );
    this.updateGraph();
  }

  // Graph algorithms
  updateGraph() {
    this.graph.clear();

    // Add buildings to graph
    for (const building of this.buildings) {
      this.graph.set(building.id, []);
    }

    // Add connections to graph
    for (const connection of this.connections) {
      if (this.graph.has(connection.from)) {
        this.graph.get(connection.from).push({
          id: connection.to,
          type: connection.type
        });
      }
      if (this.graph.has(connection.to)) {
        this.graph.get(connection.to).push({
          id: connection.from,
          type: connection.type
        });
      }
    }
  }

  /**
   * Check if the city is connected
   * @returns {boolean} true if city is connected
   */
  isCityConnected() {
    if (this.buildings.length === 0) return true;
    if (this.buildings.length === 1) return true;

    const visited = new Set();
    const startId = this.buildings[0].id;

    // BFS from first building
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const neighbors = this.graph.get(currentId) || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push(neighbor.id);
        }
      }
    }

    return visited.size === this.buildings.length;
  }

  /**
   * Find connected components
   * @returns {Array} list of connected components
   */
  findConnectedComponents() {
    const visited = new Set();
    const components = [];

    for (const building of this.buildings) {
      if (!visited.has(building.id)) {
        // BFS to find new component
        const component = [];
        const queue = [building.id];

        while (queue.length > 0) {
          const currentId = queue.shift();
          if (visited.has(currentId)) continue;

          visited.add(currentId);
          component.push(currentId);

          const neighbors = this.graph.get(currentId) || [];
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
              queue.push(neighbor.id);
            }
          }
        }

        components.push(component);
      }
    }
    return components;
  }

  /**
   * @returns {Object} analysis results
   */
  analyzeCity() {
    const components = this.findConnectedComponents();
    const isConnected = components.length === 1;

    // Connectivity coefficient (connections ratio to max possible)
    const maxPossibleConnections = this.buildings.length * (this.buildings.length - 1) / 2;
    const connectivityIndex = maxPossibleConnections > 0 ?
      (this.connections.length / maxPossibleConnections).toFixed(2) : 0;

    // Find isolated buildings
    const isolatedBuildings = [];
    for (const building of this.buildings) {
      const hasConnections = this.connections.some(c =>
        c.from === building.id || c.to === building.id
      );
      if (!hasConnections) {
        isolatedBuildings.push(building);
      }
    }

    // Find access issues
    const accessIssues = [];
    const serviceTypes = ['hospital', 'school', 'shop'];

    // Count houses without service access
    let totalHousesWithoutAccess = 0;
    let componentsWithoutServices = [];

    for (const component of components) {
      const servicesInComponent = this.buildings.filter(b =>
        component.includes(b.id) && serviceTypes.includes(b.type)
      );

      if (servicesInComponent.length === 0 && component.length > 0) {
        const housesInComponent = this.buildings.filter(b =>
          component.includes(b.id) && b.type === 'house'
        );

        if (housesInComponent.length > 0) {
          totalHousesWithoutAccess += housesInComponent.length;
          componentsWithoutServices.push({
            component: component,
            houseCount: housesInComponent.length
          });
        }
      }
    }

    if (totalHousesWithoutAccess > 0) {
      accessIssues.push({
        type: 'NO_SERVICE_ACCESS',
        message: `${totalHousesWithoutAccess} houses don't have access to essential services.`,
        details: componentsWithoutServices,
        severity: 'HIGH'
      });
    }

    // Check for vulnerable connections
    const vulnerableConnections = [];
    if (isConnected && this.connections.length > 0) {
      for (const connection of this.connections) {
        // Temporary copy without this connection
        const tempConnections = this.connections.filter(c => c.id !== connection.id);
        const tempGraph = new CityGraph();
        tempGraph.buildings = [...this.buildings];
        tempGraph.connections = tempConnections;
        tempGraph.updateGraph();

        if (!tempGraph.isCityConnected()) {
          vulnerableConnections.push(connection);
        }
      }
    }

    return {
      isConnected: isConnected,
      componentCount: components.length,
      components: components,
      largestComponent: components.reduce((max, comp) =>
        comp.length > max.length ? comp : max, []
      ).length,
      isolatedBuildings: isolatedBuildings,
      accessIssues: accessIssues,
      vulnerableConnections: vulnerableConnections,
      buildingCount: this.buildings.length,
      connectionCount: this.connections.length,
      connectivityIndex: connectivityIndex,
      analysisTime: new Date().toISOString()
    };
  }

  /**
   * Check educational challenges
   * @param {number} challengeId challenge number
   * @returns {Object} check result
   */
  checkChallenge(challengeId) {
    const analysis = this.analyzeCity();

    switch(challengeId) {
      case 1: // Exercise 1: Connected city with 3 houses and 1 hospital
        const houses = this.buildings.filter(b => b.type === 'house');
        const hospitals = this.buildings.filter(b => b.type === 'hospital');

        if (houses.length >= 3 && hospitals.length >= 1 && analysis.isConnected) {
          // Check that all houses have access to hospital
          const hospitalId = hospitals[0].id;
          const allHousesConnected = houses.every(house => {
            return this.isReachable(house.id, hospitalId);
          });

          return {
            completed: allHousesConnected,
            message: allHousesConnected ?
              'Excellent! Your city is connected and all houses have access to the hospital.' :
              'City is connected but some houses don\'t have access to the hospital.'
          };
        }
        return { completed: false, message: 'City must have at least 3 houses, 1 hospital, and be connected.' };

      case 2: // Exercise 2: Disconnected city with 2 separate regions
        if (analysis.componentCount >= 2 && analysis.buildingCount >= 4) {
          return {
            completed: true,
            message: `Excellent! You created ${analysis.componentCount} separate regions.`
          };
        }
        return { completed: false, message: 'City must have at least 4 buildings and 2 separate regions.' };

      case 3: // Exercise 3: Earthquake and bridge failure
        const bridges = this.connections.filter(c => c.type === 'bridge');
        if (bridges.length > 0) {
          // Check city before removing bridge
          if (analysis.isConnected) {
            // Check vulnerability
            if (analysis.vulnerableConnections.length > 0) {
              return {
                completed: true,
                message: `Critical bridge identified! Removing it would divide the city into ${analysis.vulnerableConnections.length + 1} regions.`
              };
            }
          }
        }
        return { completed: false, message: 'Create a connected city with at least one critical bridge.' };

      case 4: // Challenge 1: Shortest network
        const houseCount = this.buildings.filter(b => b.type === 'house').length;
        if (houseCount >= 5 && analysis.isConnected) {
          // Check minimum connections: n points with n-1 edges
          if (this.connections.length <= houseCount) {
            return {
              completed: true,
              message: `Well done! You connected ${houseCount} houses with only ${this.connections.length} connections.`
            };
          }
          return { completed: false, message: `You have ${this.connections.length} connections. Goal: maximum ${houseCount - 1} connections.` };
        }
        return { completed: false, message: 'Create at least 5 houses and connect them.' };

      case 5: // Challenge 2: Resilient city
        if (analysis.isConnected && this.connections.length >= 3) {
          // Check city resilience
          if (analysis.vulnerableConnections.length === 0) {
            return {
              completed: true,
              message: 'You created a resilient city! Removing any single connection won\'t disconnect it.'
            };
          }
          return { completed: false, message: `City has ${analysis.vulnerableConnections.length} vulnerable connections.` };
        }
        return { completed: false, message: 'Create a connected city with at least 3 connections.' };

      default:
        return { completed: false, message: 'Unknown challenge.' };
    }
  }

  // Check if two buildings are reachable
  isReachable(fromId, toId) {
    if (fromId === toId) return true;

    const visited = new Set();
    const queue = [fromId];
    visited.add(fromId);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const neighbors = this.graph.get(currentId) || [];

      for (const neighbor of neighbors) {
        if (neighbor.id === toId) return true;
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push(neighbor.id);
        }
      }
    }
    return false;
  }

  // Challenge management
  startChallenge(challengeId) {
    this.activeChallenge = challengeId;
    this.clearCity();

    switch(challengeId) {
      case 1:
        return {
          title: "Exercise 1: Basic Connected City",
          description: "Build a city with 3 houses and 1 hospital that is fully connected.",
          hint: "🏠---🏠---🏠---🏥",
          goal: "Every house should have access to the hospital."
        };

      case 2:
        return {
          title: "Exercise 2: Disconnected City",
          description: "Create a city with 2 separate regions that are not connected.",
          hint: "Region A: 🏠---🏥  Region B: 🏫---🛒",
          goal: "No connections between regions"
        };

      case 3:
        return {
          title: "Exercise 3: Earthquake & Bridge Failure",
          description: "Build a connected city where removing one bridge disconnects it.",
          hint: "🏠---[Bridge]---🏥---🏫",
          goal: "Identify critical bridges"
        };

      case 4:
        return {
          title: "Challenge 1: Shortest Network",
          description: "Connect 5 houses with the minimum number of roads.",
          hint: "n points can be connected with n-1 edges!",
          goal: "Maximum 4 connections"
        };

      case 5:
        return {
          title: "Challenge 2: Resilient City",
          description: "Build a city where removing any single road doesn't disconnect it.",
          hint: "Create redundant paths for increased reliability",
          goal: "No vulnerable connections"
        };
    }
    return null;
  }

  getChallengeProgress() {
    return {
      total: 5,
      completed: this.completedChallenges.length,
      progress: (this.completedChallenges.length / 5) * 100
    };
  }

  // Helper functions
  getEmojiForType(type) {
    const emojis = {
      'house': '🏠',
      'hospital': '🏥',
      'school': '🏫',
      'shop': '🛒',
      'factory': '🏭',
      'park': '🌳'
    };
    return emojis[type] || '🏢';
  }

  getLabelForType(type) {
    const labels = {
      'house': 'House',
      'hospital': 'Hospital',
      'school': 'School',
      'shop': 'Shop',
      'factory': 'Factory',
      'park': 'Park'
    };
    return labels[type] || 'Building';
  }

  getColorForType(type) {
    const colors = {
      'house': '#3498db',      // Blue
      'hospital': '#e74c3c',   // Red
      'school': '#2ecc71',     // Green
      'shop': '#f39c12',       // Orange
      'factory': '#8e44ad',    // Purple
      'park': '#27ae60'        // Dark green
    };
    return colors[type] || '#95a5a6';
  }

  getStyleForConnection(type) {
    const styles = {
      'road': { color: '#7f8c8d', width: 3, dash: [] },
      'bridge': { color: '#3498db', width: 3, dash: [5, 5] },
      'metro': { color: '#e74c3c', width: 4, dash: [] },
      'walkway': { color: '#2ecc71', width: 2, dash: [2, 2] }
    };
    return styles[type] || styles.road;
  }

  // Calculate distance between two buildings
  calculateDistance(building1, building2) {
    const dx = building1.x - building2.x;
    const dy = building1.y - building2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Save city to LocalStorage
  saveToLocalStorage(key = 'citytopo_save') {
    const saveData = {
      buildings: this.buildings,
      connections: this.connections,
      threshold: this.threshold,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(key, JSON.stringify(saveData));
    return true;
  }

  // Load city from LocalStorage
  loadFromLocalStorage(key = 'citytopo_save') {
    const saved = localStorage.getItem(key);
    if (!saved) return false;

    try {
      const saveData = JSON.parse(saved);
      this.buildings = saveData.buildings || [];
      this.connections = saveData.connections || [];
      this.threshold = saveData.threshold || 100;
      this.updateGraph();
      return true;
    } catch (error) {
      console.error('Error loading save:', error);
      return false;
    }
  }

  // Reset entire city
  clearCity() {
    this.buildings = [];
    this.connections = [];
    this.graph.clear();
  }
}

// Export class for use in main file
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CityGraph;
}
