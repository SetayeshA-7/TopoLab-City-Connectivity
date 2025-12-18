// Global variables
let cityGraph = null;
let selectedSticker = 'house';
let selectedConnection = 'road';
let isDrawingConnection = false;
let connectionStart = null;
let canvas = null;
let ctx = null;
let currentChallenge = null;

// Main function - when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded - Starting app...');
  initApp();
});

function initApp() {
  console.log('Starting TopoLab Urban Connectivity Simulator...');

  // Initialize CityGraph
  cityGraph = new CityGraph();
  syncChallengeData();
  console.log('CityGraph created');

  // Initialize canvas
  canvas = document.getElementById('cityCanvas');
  if (!canvas) {
    console.error('Error: Canvas with id="cityCanvas" not found!');
    alert('Error: Canvas element not found!');
    return;
  }

  console.log('Canvas found:', canvas);

  // Get canvas context
  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Error: Could not get canvas context!');
    alert('Error: Your browser does not support canvas!');
    return;
  }

  console.log('Canvas and context initialized successfully');

  // Set actual canvas size based on parent capacity
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Canvas events
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('contextmenu', handleCanvasRightClick);

  document.addEventListener('keydown', handleKeyPress);

  // Sticker palette events
  document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedSticker = this.dataset.type;

      // Update active button style
      document.querySelectorAll('.sticker-btn').forEach(b =>
        b.classList.remove('active')
      );
      this.classList.add('active');

      // Change cursor
      if (canvas) {
        canvas.style.cursor = 'crosshair';
      }

      console.log('Sticker selected:', selectedSticker);
    });
  });

  // Select first sticker by default
  const defaultSticker = document.querySelector('.sticker-btn[data-type="house"]');
  if (defaultSticker) {
    defaultSticker.classList.add('active');
    console.log('Default sticker selected: house');
  }

  // Connection palette events
  document.querySelectorAll('.connection-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedConnection = this.dataset.type;

      // Update active button style
      document.querySelectorAll('.connection-btn').forEach(b =>
        b.classList.remove('active')
      );
      this.classList.add('active');

      // Change cursor
      if (canvas) {
        canvas.style.cursor = 'crosshair';
      }

      console.log('Connection selected:', selectedConnection);
    });
  });

  // Select first connection by default
  const defaultConnection = document.querySelector('.connection-btn[data-type="road"]');
  if (defaultConnection) {
    defaultConnection.classList.add('active');
    console.log('Default connection selected: road');
  }

  // Analyze button event
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function() {
      console.log('Analyze button clicked');
      const analysis = cityGraph.analyzeCity();
      displayAnalysisResults(analysis);
      drawCity();
      console.log('Analysis completed:', analysis);

      // If challenge is active, check it
      if (currentChallenge) {
        checkCurrentChallenge();
      }
    });
  }

  // Clear button event
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear the entire city?')) {
        cityGraph.clearCity();
        drawCity();
        updateUI();
        console.log('City cleared.');
      }
    });
  }

  // Save button event
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      cityGraph.saveToLocalStorage();
      showMessage('City saved successfully!', 'success');
      console.log('City saved.');
    });
  }

  // Report button event
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', function() {
      generateReport();
    });
  }

  // Challenges button event
  const challengesBtn = document.getElementById('challengesBtn');
  if (challengesBtn) {
    challengesBtn.addEventListener('click', function() {
      showChallengesPanel();
    });
  }

  const deleteModeBtn = document.getElementById('deleteModeBtn');
  if (deleteModeBtn) {
    deleteModeBtn.addEventListener('click', toggleDeleteMode);
  }

  // Threshold slider event
  const thresholdSlider = document.getElementById('connectivityThreshold');
  const thresholdValue = document.getElementById('thresholdValue');

  if (thresholdSlider && thresholdValue) {
    thresholdSlider.addEventListener('input', function() {
      cityGraph.threshold = parseInt(this.value);
      thresholdValue.textContent = `${this.value} pixels`;
      updateUI();
      console.log('Threshold changed to:', this.value);
    });
  }

  // Grid snap checkbox event
  const gridSnap = document.getElementById('gridSnap');
  const gridOverlay = document.getElementById('gridOverlay');

  if (gridSnap && gridOverlay) {
    gridSnap.addEventListener('change', function() {
      gridOverlay.style.display = this.checked ? 'block' : 'none';
      console.log('Grid snapping:', this.checked ? 'enabled' : 'disabled');
    });
  }

  // Create sample city button
  const createSampleBtn = document.getElementById('createSampleBtn');
  if (createSampleBtn) {
    createSampleBtn.addEventListener('click', createSampleCity);
  }

  // Load last save button
  const loadLastSaveBtn = document.getElementById('loadLastSaveBtn');
  if (loadLastSaveBtn) {
    loadLastSaveBtn.addEventListener('click', function() {
      if (cityGraph.loadFromLocalStorage()) {
        drawCity();
        updateUI();
        showMessage('Last saved city loaded!', 'success');
      } else {
        showMessage('No saved city found!', 'warning');
      }
    });
  }

  // Challenge events
  document.addEventListener('click', function(e) {
    // Start challenge button
    if (e.target.classList.contains('btn-start-challenge') ||
      e.target.closest('.btn-start-challenge')) {
      const button = e.target.closest('.btn-start-challenge');
      const challengeId = parseInt(button.dataset.challenge);
      startChallenge(challengeId);
    }

    // Show hint button
    if (e.target.classList.contains('btn-show-hint') ||
      e.target.closest('.btn-show-hint')) {
      const button = e.target.closest('.btn-show-hint');
      const challengeId = parseInt(button.dataset.challenge);
      showChallengeHint(challengeId);
    }

    // Show details button
    if (e.target.classList.contains('btn-show-details') ||
      e.target.closest('.btn-show-details')) {
      const button = e.target.closest('.btn-show-details');
      const challengeId = parseInt(button.dataset.challenge);
      showChallengeDetails(challengeId);
    }

    // Click on challenge card (toggle details)
    if (e.target.closest('.challenge-card')) {
      const card = e.target.closest('.challenge-card');
      const details = card.querySelector('.challenge-details');
      if (details && !e.target.closest('.challenge-actions')) {
        details.style.display = details.style.display === 'block' ? 'none' : 'block';
      }
    }
  });

  // Load from localStorage
  loadFromLocalStorage();

  // Initial render
  drawCity();
  updateUI();
  updateChallengeProgress();

  // Populate challenge cards
  setTimeout(() => {
    populateChallengeCards();
    updateChallengeProgress();
  }, 100); // Small delay to ensure full load

  console.log('App started successfully and ready to use!');
}

// After initApp() add this function
function populateChallengeCards() {
  if (!challengeManager) {
    console.error('ChallengeManager not found!');
    return;
  }

  const challengesList = document.querySelector('.challenges-list');
  if (!challengesList) return;

  // Clear current content
  challengesList.innerHTML = '';

  // Create card for each challenge
  const allChallenges = challengeManager.getAllChallenges();

  allChallenges.forEach(challenge => {
    const isCompleted = challengeManager.isChallengeCompleted(challenge.id);

    const challengeCard = document.createElement('div');
    challengeCard.className = `challenge-card ${isCompleted ? 'completed' : ''}`;
    challengeCard.dataset.challenge = challenge.id;

    challengeCard.innerHTML = `
      <h4>
        <i class="fas fa-${challenge.type === 'challenge' ? 'medal' : 'star'}"></i>
        ${isCompleted ? '✅ ' : ''}${challenge.title}
        <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
      </h4>
      <p>${challenge.description}</p>
      <div class="challenge-details" style="display: none;">
        <p><strong>🎯 Goal:</strong> ${challenge.solution}</p>
        <p><strong>💡 Math Tip:</strong> ${challengeManager.getEducationalTip(challenge.id)}</p>
      </div>
      <div class="challenge-actions">
        <button class="btn btn-sm btn-start-challenge" data-challenge="${challenge.id}">
          <i class="fas fa-play"></i> Start Challenge
        </button>
        <button class="btn btn-sm btn-show-hint" data-challenge="${challenge.id}">
          <i class="fas fa-lightbulb"></i> Hint
        </button>
        <button class="btn btn-sm btn-show-details" data-challenge="${challenge.id}">
          <i class="fas fa-info-circle"></i> Details
        </button>
      </div>
    `;

    challengesList.appendChild(challengeCard);
  });

  console.log('Challenge cards created successfully.');
}

// 3. Function to show challenge hint
function showChallengeHint(challengeId) {
  const challenge = challengeManager.getChallenge(challengeId);
  if (challenge) {
    showMessage(`💡 Challenge Hint ${challenge.title}:<br><br>${challenge.hint}`, 'info');
  }
}

// 4. Function to show challenge details
function showChallengeDetails(challengeId) {
  const challenge = challengeManager.getChallenge(challengeId);
  if (challenge) {
    const educationalTip = challengeManager.getEducationalTip(challengeId);
    showMessage(`
      <strong>${challenge.title}</strong><br>
      <small>Difficulty: ${challenge.difficulty} | Type: ${challenge.type === 'challenge' ? 'Challenge' : 'Exercise'}</small>
      <hr>
      <p><strong>Description:</strong> ${challenge.description}</p>
      <p><strong>Hint:</strong> ${challenge.hint}</p>
      <p><strong>Goal:</strong> ${challenge.solution}</p>
      <hr>
      <p><strong>💡 Educational Tip:</strong> ${educationalTip}</p>
    `, 'info');
  }
}

// Canvas functions
function resizeCanvas() {
  if (!canvas) {
    console.error('Error in resizeCanvas: canvas not defined.');
    return;
  }

  const container = canvas.parentElement;
  if (!container) {
    console.error('Error: canvas parent not found.');
    return;
  }

  const rect = container.getBoundingClientRect();

  // Only resize if dimensions changed
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;

    console.log('Canvas resized to:', canvas.width, 'x', canvas.height);

    // Re-render
    drawCity();
  }
}

function handleCanvasClick(event) {
  if (!canvas || !ctx || !cityGraph) {
    console.error('Error in handleCanvasClick: essential variables not defined.');
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log('Canvas click at position:', x.toFixed(0), y.toFixed(0));

  // If in delete mode
  if (canvas.classList.contains('delete-mode')) {
    handleDeleteClick(x, y);
    return;
  }

  // If not drawing connection, add building
  if (!isDrawingConnection) {
    // Check if clicked on existing building
    const clickedBuilding = cityGraph.getBuildingAt(x, y);

    if (!clickedBuilding) {
      // Add new building
      const building = cityGraph.addBuilding(selectedSticker, x, y);
      console.log('New building added:', {
        type: building.type,
        x: building.x,
        y: building.y,
        id: building.id
      });

      // Draw city
      drawCity();
      updateUI();

      // If challenge is active, check it
      if (currentChallenge) {
        checkCurrentChallenge();
      }
    } else {
      console.log('Clicked on existing building:', clickedBuilding);
    }
  }
}

function handleDeleteClick(x, y) {
  // First check if clicked on connection
  const clickedConnection = findConnectionAt(x, y);
  if (clickedConnection) {
    if (confirm('Do you want to delete this connection?')) {
      cityGraph.removeConnection(clickedConnection.id);
      drawCity();
      updateUI();
      showMessage('Connection deleted!', 'success');
    }
    return;
  }

  // If not on connection, check if clicked on building
  const clickedBuilding = cityGraph.getBuildingAt(x, y);
  if (clickedBuilding) {
    if (confirm(`Do you want to delete building ${clickedBuilding.label}?\nAll related connections will also be deleted.`)) {
      cityGraph.removeBuilding(clickedBuilding.id);
      drawCity();
      updateUI();
      showMessage(`Building ${clickedBuilding.label} deleted!`, 'success');
    }
    return;
  }

  showMessage('No element found at this point to delete.', 'info');
}

function handleCanvasMouseDown(event) {
  if (!canvas || !cityGraph) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log('MouseDown at position:', x.toFixed(0), y.toFixed(0));

  // Check if clicked on building
  const clickedBuilding = cityGraph.getBuildingAt(x, y);

  if (clickedBuilding) {
    // Start drawing connection
    isDrawingConnection = true;
    connectionStart = clickedBuilding;

    // Change cursor
    canvas.style.cursor = 'grabbing';
    console.log('Start drawing connection from building:', clickedBuilding.id);
  }
}

function handleCanvasMouseMove(event) {
  if (!isDrawingConnection || !connectionStart || !ctx || !canvas) return;

  // Draw temporary line
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // First draw the city
  drawCity();

  // Then draw temporary line
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(connectionStart.x, connectionStart.y);
  ctx.lineTo(x, y);
  ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.restore();

  // Draw small circle at mouse position
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
  ctx.fill();

  handleHoverForDeletion(event);
}

function handleHoverForDeletion(event) {
  if (!canvas || !cityGraph) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Check hover on building
  const hoveredBuilding = cityGraph.getBuildingAt(x, y);
  if (hoveredBuilding) {
    canvas.classList.add('building-hover');
  } else {
    canvas.classList.remove('building-hover');
  }
}

function handleCanvasMouseUp(event) {
  if (!isDrawingConnection || !connectionStart || !canvas || !cityGraph) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log('MouseUp at position:', x.toFixed(0), y.toFixed(0));

  // Check if released on another building
  const targetBuilding = cityGraph.getBuildingAt(x, y);

  if (targetBuilding && targetBuilding.id !== connectionStart.id) {
    // Create connection
    const connection = cityGraph.addConnection(
      connectionStart.id,
      targetBuilding.id,
      selectedConnection
    );

    if (connection) {
      console.log('Connection successfully created between:',
        connectionStart.id, 'and', targetBuilding.id,
        'type:', selectedConnection
      );

      // Draw city
      drawCity();
      updateUI();

      // If challenge is active, check it
      if (currentChallenge) {
        checkCurrentChallenge();
      }
    } else {
      console.log('Connection already exists or error occurred');
      showMessage('This connection already exists!', 'warning');
    }
  } else if (targetBuilding && targetBuilding.id === connectionStart.id) {
    showMessage('Cannot connect a building to itself!', 'warning');
  } else {
    console.log('Connection canceled - not released on another building');
  }

  // Reset state
  isDrawingConnection = false;
  connectionStart = null;
  canvas.style.cursor = 'crosshair';

  // Redraw to clear temporary line
  drawCity();
}

// Function to find connection at position
function findConnectionAt(x, y, threshold = 10) {
  if (!cityGraph || !cityGraph.connections.length) return null;

  let closestConnection = null;
  let closestDistance = threshold;

  cityGraph.connections.forEach(connection => {
    const fromBuilding = cityGraph.buildings.find(b => b.id === connection.from);
    const toBuilding = cityGraph.buildings.find(b => b.id === connection.to);

    if (!fromBuilding || !toBuilding) return;

    // Calculate point distance from line (connection)
    const distance = pointToLineDistance(
      x, y,
      fromBuilding.x, fromBuilding.y,
      toBuilding.x, toBuilding.y
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestConnection = connection;
    }
  });

  return closestConnection;
}

// Helper function: calculate point distance from line
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

function handleCanvasRightClick(event) {
  event.preventDefault(); // Prevent default browser context menu

  if (!canvas || !cityGraph) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log('Right-click at position:', x.toFixed(0), y.toFixed(0));

  // 1. First check if clicked on connection
  const clickedConnection = findConnectionAt(x, y);
  if (clickedConnection) {
    if (confirm(`Do you want to delete this connection?`)) {
      cityGraph.removeConnection(clickedConnection.id);
      drawCity();
      updateUI();
      showMessage('Connection deleted!', 'success');
    }
    return;
  }

  // 2. If not on connection, check if clicked on building
  const clickedBuilding = cityGraph.getBuildingAt(x, y);
  if (clickedBuilding) {
    if (confirm(`Do you want to delete building ${clickedBuilding.label}?\nAll related connections will be deleted.`)) {
      cityGraph.removeBuilding(clickedBuilding.id);
      drawCity();
      updateUI();
      showMessage(`Building ${clickedBuilding.label} deleted!`, 'success');
    }
    return;
  }

  // 3. If clicked on nothing, show simple context menu
  showContextMenu(event.clientX, event.clientY);
}

function handleKeyPress(event) {
  // Only if focused on canvas or whole page
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return; // Allow typing in inputs
  }

  switch(event.key) {
    case 'Delete':
    case 'Backspace':
      deleteSelectedElement();
      break;

    case 'Escape':
      // Cancel any mode
      if (canvas) {
        canvas.classList.remove('delete-mode');
        canvas.style.cursor = 'crosshair';
      }
      break;

    case 'd':
    case 'D':
      if (event.ctrlKey) {
        // Ctrl+D to activate delete mode
        toggleDeleteMode();
      }
      break;
  }
}

function deleteSelectedElement() {
  // In future when elements are selected, delete them here
  // For now show a message
  showMessage('To delete, right-click on a building or connection.', 'info');
}

function toggleDeleteMode() {
  if (!canvas) return;

  const deleteModeBtn = document.getElementById('deleteModeBtn');

  if (canvas.classList.contains('delete-mode')) {
    canvas.classList.remove('delete-mode');
    canvas.style.cursor = 'crosshair';
    if (deleteModeBtn) deleteModeBtn.classList.remove('active');
    showMessage('Delete mode deactivated.', 'info');
  } else {
    canvas.classList.add('delete-mode');
    if (deleteModeBtn) deleteModeBtn.classList.add('active');
    showMessage('Delete mode activated. Click on buildings or connections to delete them.', 'info');
  }
}

// Rendering functions
function drawCity() {
  if (!canvas || !ctx || !cityGraph) {
    console.error('Error in drawCity: canvas, ctx or cityGraph not defined');
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // If no buildings, show message
  if (cityGraph.buildings.length === 0) {
    ctx.font = '20px Inter, sans-serif';
    ctx.fillStyle = '#95a5a6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('To start, click on the canvas', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Draw connections
  drawConnections();

  // Draw buildings
  drawBuildings();

  // Draw highlights for components (if analyzed)
  const analysis = cityGraph.analyzeCity();
  if (analysis.componentCount > 1) {
    highlightComponents(analysis.components);
  }
}

function drawBuildings() {
  if (!ctx || !cityGraph) return;

  cityGraph.buildings.forEach(building => {
    // Background circle
    ctx.beginPath();
    ctx.arc(building.x, building.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = building.color + '20'; // 20 = 12% opacity
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(building.x, building.y, 25, 0, Math.PI * 2);
    ctx.strokeStyle = building.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sticker (emoji)
    ctx.font = '24px Arial, Segoe UI Emoji, Apple Color Emoji, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(building.emoji, building.x, building.y);

    // Label
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText(building.label, building.x, building.y + 35);
  });
}

function drawConnections() {
  if (!ctx || !cityGraph) return;

  cityGraph.connections.forEach(connection => {
    const fromBuilding = cityGraph.buildings.find(b => b.id === connection.from);
    const toBuilding = cityGraph.buildings.find(b => b.id === connection.to);

    if (!fromBuilding || !toBuilding) {
      console.warn('Connection not found:', connection);
      return;
    }

    const style = connection.style;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fromBuilding.x, fromBuilding.y);
    ctx.lineTo(toBuilding.x, toBuilding.y);
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;

    if (style.dash && style.dash.length > 0) {
      ctx.setLineDash(style.dash);
    }

    ctx.stroke();
    ctx.restore();

    // Show direction arrow (for one-way connections)
    if (style.arrow) {
      drawArrow(ctx, fromBuilding.x, fromBuilding.y, toBuilding.x, toBuilding.y, style.color);
    }
  });
}

function drawArrow(context, fromX, fromY, toX, toY, color) {
  const headlen = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;

  // Main line
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();

  // Arrow head
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 7),
    toY - headlen * Math.sin(angle - Math.PI / 7)
  );
  context.lineTo(
    toX - headlen * Math.cos(angle + Math.PI / 7),
    toY - headlen * Math.sin(angle + Math.PI / 7)
  );
  context.lineTo(toX, toY);
  context.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 7),
    toY - headlen * Math.sin(angle - Math.PI / 7)
  );
  context.fill();
  context.restore();
}

function highlightComponents(components) {
  if (!ctx || !cityGraph) return;

  // Different colors for highlighting components
  const colors = [
    'rgba(52, 152, 219, 0.1)',   // Blue
    'rgba(46, 204, 113, 0.1)',   // Green
    'rgba(155, 89, 182, 0.1)',   // Purple
    'rgba(241, 196, 15, 0.1)',   // Yellow
    'rgba(230, 126, 34, 0.1)',   // Orange
  ];

  components.forEach((component, index) => {
    if (component.length === 0) return;

    // Find component boundaries
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    component.forEach(buildingId => {
      const building = cityGraph.buildings.find(b => b.id === buildingId);
      if (building) {
        minX = Math.min(minX, building.x - 25);
        minY = Math.min(minY, building.y - 25);
        maxX = Math.max(maxX, building.x + 25);
        maxY = Math.max(maxY, building.y + 25);
      }
    });

    // Draw highlight rectangle
    const padding = 20;
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      minX - padding,
      minY - padding,
      maxX - minX + padding * 2,
      maxY - minY + padding * 2
    );
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = colors[index % colors.length].replace('0.1', '0.5');
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.restore();

    // Display component number
    ctx.save();
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = colors[index % colors.length].replace('0.1', '0.8');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Component ${index + 1}`, minX - padding + 5, minY - padding + 5);
    ctx.restore();
  });
}

// UI functions
function updateUI() {
  if (!cityGraph) return;

  // Update statistics
  const buildingCountElem = document.getElementById('buildingCount');
  const connectionCountElem = document.getElementById('connectionCount');
  const componentCountElem = document.getElementById('componentCount');
  const largestComponentElem = document.getElementById('largestComponent');
  const connectivityIndexElem = document.getElementById('connectivityIndex');
  const statusElement = document.getElementById('connectivityStatus');

  if (buildingCountElem) {
    buildingCountElem.textContent = cityGraph.buildings.length;
  }

  if (connectionCountElem) {
    connectionCountElem.textContent = cityGraph.connections.length;
  }

  // Different statuses based on building count
  if (cityGraph.buildings.length === 0) {
    // Case 1: Empty canvas
    if (statusElement) {
      statusElement.textContent = 'Canvas empty!';
      statusElement.className = 'result-value status-empty';
    }

    if (componentCountElem) {
      componentCountElem.textContent = '0';
    }

    if (largestComponentElem) {
      largestComponentElem.textContent = '0 buildings';
    }

    if (connectivityIndexElem) {
      connectivityIndexElem.textContent = '0.00';
    }

    // Clear issues list
    const issuesList = document.getElementById('issuesList');
    if (issuesList) {
      issuesList.innerHTML = '<li class="no-issues">No buildings added yet</li>';
    }

    // Update educational tip
    const tipElement = document.getElementById('educationalTip');
    if (tipElement) {
      tipElement.innerHTML = `
        <strong>Let's get started! 🎯</strong><br>
        To begin, click on the canvas to add your first building.
        Then create connections between buildings and observe connectivity analysis.
      `;
    }

    return;

  } else if (cityGraph.buildings.length === 1) {
    // Case 2: Only one building
    if (statusElement) {
      statusElement.textContent = '1 building';
      statusElement.className = 'result-value status-single';
    }

    if (componentCountElem) {
      componentCountElem.textContent = '1';
    }

    if (largestComponentElem) {
      largestComponentElem.textContent = '1 building';
    }

    if (connectivityIndexElem) {
      connectivityIndexElem.textContent = '0.00';
    }

    const issuesList = document.getElementById('issuesList');
    if (issuesList) {
      issuesList.innerHTML = '<li class="no-issues">City has only one building. Add more buildings to perform connectivity analysis.</li>';
    }

    // Update educational tip
    const tipElement = document.getElementById('educationalTip');
    if (tipElement) {
      tipElement.innerHTML = `
        <strong>Great! You added your first building. 🎉</strong><br>
        Now add more buildings and create connections between them.
        Remember: a city is <strong>connected</strong> when you can travel from any building
        to any other building.
      `;
    }

  } else {
    // Case 3: Two or more buildings - actual analysis
    const analysis = cityGraph.analyzeCity();

    if (componentCountElem) {
      componentCountElem.textContent = analysis.componentCount;
    }

    if (largestComponentElem) {
      largestComponentElem.textContent = `${analysis.largestComponent} buildings`;
    }

    if (connectivityIndexElem) {
      connectivityIndexElem.textContent = analysis.connectivityIndex;
    }

    // Determine connectivity status
    if (statusElement) {
      if (analysis.isConnected) {
        statusElement.textContent = 'connected';
        statusElement.className = 'result-value status-connected';
      } else {
        statusElement.textContent = 'disconnected';
        statusElement.className = 'result-value status-disconnected';
      }
    }

    // Update issues list
    displayAnalysisResults(analysis);
    // Update educational tips
    updateEducationalTip(analysis);
  }
}

function displayAnalysisResults(analysis) {
  if (!analysis) return;

  console.log('Displaying analysis results:', analysis);

  // Update issues list
  const issuesList = document.getElementById('issuesList');
  if (!issuesList) return;

  issuesList.innerHTML = '';

  // If no buildings
  if (analysis.buildingCount === 0) {
    const li = document.createElement('li');
    li.textContent = 'No buildings added yet.';
    li.className = 'no-issues';
    issuesList.appendChild(li);
    return; // Early exit
  }

  // If only one building
  if (analysis.buildingCount === 1) {
    const li = document.createElement('li');
    li.textContent = 'City has only one building. Add more buildings to perform connectivity analysis.';
    li.className = 'no-issues';
    issuesList.appendChild(li);
    return; // Early exit
  }

  // For two or more buildings (actual analysis)
  if (analysis.isolatedBuildings && analysis.isolatedBuildings.length > 0) {
    const li = document.createElement('li');
    li.textContent = `${analysis.isolatedBuildings.length} buildings are completely isolated.`;
    issuesList.appendChild(li);
  }

  if (analysis.accessIssues && analysis.accessIssues.length > 0) {
    analysis.accessIssues.forEach(issue => {
      const li = document.createElement('li');
      li.textContent = issue.message;
      issuesList.appendChild(li);
    });
  }

  if (!analysis.isConnected && analysis.componentCount > 1) {
    const li = document.createElement('li');
    li.textContent = `City is divided into ${analysis.componentCount} separate regions.`;
    issuesList.appendChild(li);
  }

  // Check for vulnerabilities
  if (analysis.vulnerableConnections && analysis.vulnerableConnections.length > 0) {
    const li = document.createElement('li');
    li.textContent = `${analysis.vulnerableConnections.length} vulnerable connections found.`;
    issuesList.appendChild(li);
  }

  // If no issues found and at least 2 buildings
  if (issuesList.children.length === 0 && analysis.buildingCount >= 2) {
    const li = document.createElement('li');
    if (analysis.isConnected) {
      li.textContent = 'City is ideal! Everything is well connected.';
    } else {
      li.textContent = 'No issues identified.';
    }
    li.className = 'no-issues';
    issuesList.appendChild(li);
  }
  updateEducationalTip(analysis);
}

function updateEducationalTip(analysis) {
  const tipElement = document.getElementById('educationalTip');
  if (!tipElement) return;

  if (analysis.buildingCount === 0) {
    tipElement.innerHTML = `
      <strong>🎯 Get started!</strong><br>
      • Click on the canvas to add your first building.<br>
      • Goal: Understand <strong>connectivity</strong> and <strong>disconnectedness</strong> concepts.<br>
      • These concepts have applications in topology, graph theory, and computer networks.
    `;
  } else if (analysis.buildingCount === 1) {
    tipElement.innerHTML = `
      <strong>🚀 Continue...</strong><br>
      • Add at least one more building.<br>
      • <strong>Definition of connectivity:</strong> A set is connected if it cannot be divided into two non-empty disjoint open subsets.<br>
      • With just one point, connectivity discussion is meaningless!
    `;
  } else if (analysis.isConnected) {
    // City is connected
    let additionalInfo = '';

    if (analysis.vulnerableConnections && analysis.vulnerableConnections.length > 0) {
      additionalInfo = `
        <br>⚠️ <strong>Warning:</strong> ${analysis.vulnerableConnections.length} <strong>vulnerable connections</strong> identified.
        These connections are "bridges" and removing them would disconnect the city.
      `;
    } else if (analysis.connectivityIndex < 0.3) {
      additionalInfo = `
        <br>💡 <strong>Tip:</strong> City's connectivity coefficient is low.
        For a more resilient network, create more connections.
      `;
    }

    tipElement.innerHTML = `
      <strong>✅ City is connected!</strong><br>
      • <strong>Mathematical definition:</strong> You can travel from any point to any other point.<br>
      • <strong>Connectivity coefficient:</strong> ${analysis.connectivityIndex}. (Closer to 1 is better)${additionalInfo}
    `;
  } else {
    // City is disconnected
    let componentInfo = '';
    if (analysis.componentCount > 1) {
      componentInfo = `
        <br>🔍 <strong>Analysis:</strong> City is divided into ${analysis.componentCount} connected components:<br>
        • To connect them, create connections between components.
      `;
    }

    tipElement.innerHTML = `
      <strong>❌ City is disconnected!</strong><br>
      • <strong>Mathematical definition:</strong> City can be divided into two disjoint open subsets.<br>
      • <strong>Example:</strong> Two islands without a bridge.${componentInfo}<br>
    `;
  }
}

// Challenge functions
function showChallengesPanel() {
  const challengesPanel = document.getElementById('challengesPanel');
  const reportPanel = document.getElementById('reportPanel');

  if (reportPanel) reportPanel.style.display = 'none';
  if (challengesPanel) {
    challengesPanel.style.display = 'block';
    updateChallengeProgress();

    // Update completion status of challenges
    document.querySelectorAll('.challenge-card').forEach(card => {
      const challengeId = parseInt(card.dataset.challenge);
      if (cityGraph.completedChallenges.includes(challengeId)) {
        card.classList.add('completed');
      } else {
        card.classList.remove('completed');
      }
    });
  }
}

function startChallenge(challengeId) {
  currentChallenge = challengeId;
  const challengeInfo = cityGraph.startChallenge(challengeId);

  if (challengeInfo) {
    // Update current challenge status
    const challengeStatus = document.getElementById('currentChallengeStatus');
    if (challengeStatus) {
      challengeStatus.innerHTML = `
        <p><strong>${challengeInfo.title}</strong></p>
        <p>${challengeInfo.description}</p>
        <p><small><strong>Goal:</strong> ${challengeInfo.goal}</small></p>
        <button onclick="checkCurrentChallenge()" class="btn btn-sm btn-primary">
          <i class="fas fa-check"></i> Check Answer
        </button>
      `;
    }

    // Hide challenges panel
    const challengesPanel = document.getElementById('challengesPanel');
    if (challengesPanel) {
      challengesPanel.style.display = 'none';
    }

    showMessage(`Challenge "${challengeInfo.title}" started!`, 'info');
  }
}

function checkCurrentChallenge() {
  if (!currentChallenge) return;

  const result = cityGraph.checkChallenge(currentChallenge);

  if (result.completed) {
    challengeManager.completeChallenge(currentChallenge);
    updateChallengeProgress();

    showMessage(`Congratulations! Challenge completed. ${result.message}`, 'success');

    // Update current challenge status
    const challengeStatus = document.getElementById('currentChallengeStatus');
    if (challengeStatus) {
      challengeStatus.innerHTML = `
        <p><strong>✅ Challenge Completed!</strong></p>
        <p>${result.message}</p>
        <button onclick="showChallengesPanel()" class="btn btn-sm btn-success">
          <i class="fas fa-trophy"></i> Back to Challenges
        </button>
      `;
    }

    currentChallenge = null;
  } else {
    showMessage(result.message, 'warning');
  }
}

function updateChallengeProgress() {
  const progress = cityGraph.getChallengeProgress();
  const progressFill = document.getElementById('challengeProgress');
  const completedCount = document.getElementById('completedCount');

  if (progressFill) {
    progressFill.style.width = `${progress.progress}%`;
  }

  if (completedCount) {
    completedCount.textContent = `${progress.completed}/${progress.total} challenges completed`;
  }
}

// Report functions
function generateReport() {
  const reportGenerator = new ReportGenerator(cityGraph);
  const reportHTML = reportGenerator.generateHTMLReport();

  const reportContent = document.getElementById('reportContent');
  const reportPanel = document.getElementById('reportPanel');
  const challengesPanel = document.getElementById('challengesPanel');

  if (challengesPanel) challengesPanel.style.display = 'none';

  if (reportContent && reportPanel) {
    reportContent.innerHTML = reportHTML;
    reportPanel.style.display = 'block';

    // Add necessary styles
    injectReportStyles();

    // Button events
    document.getElementById('printReportBtn').onclick = () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html dir="ltr">
        <head>
          <title>TopoLab Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            ${getReportStyles()}
          </style>
        </head>
        <body>${reportHTML}</body>
        </html>
      `);
      printWindow.print();
    };

    document.getElementById('shareReportBtn').onclick = () => {
      reportGenerator.shareReport();
    };

    document.getElementById('closeReportBtn').onclick = () => {
      reportPanel.style.display = 'none';
    };
  }
}

function injectReportStyles() {
  // If styles not already added, add them
  if (!document.getElementById('report-styles')) {
    const style = document.createElement('style');
    style.id = 'report-styles';
    style.textContent = getReportStyles();
    document.head.appendChild(style);
  }
}

function getReportStyles() {
  return `
    .report { font-family: 'Inter', sans-serif; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
  `;
}

function printReport() {
  const printContent = document.getElementById('reportContent').innerHTML;
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = `
    <!DOCTYPE html>
    <html dir="ltr">
    <head>
      <meta charset="UTF-8">
      <title>TopoLab Urban Connectivity Report</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; }
        h4 { color: #4361ee; }
        .report-summary { background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <h3>City Analysis Report - TopoLab</h3>
      ${printContent}
      <p style="margin-top: 30px; font-size: 12px; color: #6c757d;">
        Generated by TopoLab Urban Connectivity Simulator - ${new Date().toLocaleString('en-US')}
      </p>
    </body>
    </html>
  `;

  window.print();
  document.body.innerHTML = originalContent;
  location.reload(); // Restore main page
}

function shareReport() {
  if (navigator.share) {
    const analysis = cityGraph.analyzeCity();
    navigator.share({
      title: 'TopoLab City Analysis Report',
      text: `Connectivity: ${analysis.isConnected ? 'Connected' : 'Disconnected'} | Buildings: ${analysis.buildingCount} | Connections: ${analysis.connectionCount}`,
      url: window.location.href
    });
  } else {
    // If Web Share API not supported
    const text = `TopoLab City Analysis Report:
Status: ${cityGraph.isCityConnected() ? 'Connected' : 'Disconnected'}
Buildings: ${cityGraph.buildings.length}
Connections: ${cityGraph.connections.length}
Components: ${cityGraph.findConnectedComponents().length}

View at: ${window.location.href}`;

    navigator.clipboard.writeText(text).then(() => {
      showMessage('Report copied to clipboard!', 'success');
    });
  }
}

// Helper functions
function showMessage(message, type = 'info') {
  const modal = document.getElementById('messageModal');
  const modalMessage = document.getElementById('modalMessage');
  const closeModal = document.querySelector('.close-modal');

  if (!modal || !modalMessage) return;

  // Set color based on message type
  let icon = 'ℹ️';
  let color = '#4361ee';

  switch(type) {
    case 'success':
      icon = '✅';
      color = '#2ecc71';
      break;
    case 'warning':
      icon = '⚠️';
      color = '#f39c12';
      break;
    case 'danger':
      icon = '❌';
      color = '#e74c3c';
      break;
  }

  modalMessage.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
      <h3 style="color: ${color}; margin-bottom: 15px;">${type === 'success' ? 'Success!' : type === 'warning' ? 'Warning!' : type === 'danger' ? 'Error!' : 'Information'}</h3>
      <p style="font-size: 16px; line-height: 1.6;">${message}</p>
    </div>
  `;

  modal.style.display = 'block';

  // Close modal
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  // Auto-close after 5 seconds (for success messages)
  if (type === 'success') {
    setTimeout(() => {
      modal.style.display = 'none';
    }, 5000);
  }
}

function createSampleCity() {
  if (!cityGraph || !canvas) {
    console.error('Error in createSampleCity: cityGraph or canvas not defined');
    return;
  }

  if (confirm('Do you want to create a sample city?')) {
    console.log('Creating sample city...');

    // Create sample city
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Buildings
    const house1 = cityGraph.addBuilding('house', centerX - 150, centerY - 100);
    const hospital = cityGraph.addBuilding('hospital', centerX, centerY);
    const school = cityGraph.addBuilding('school', centerX + 150, centerY - 50);
    const shop = cityGraph.addBuilding('shop', centerX, centerY + 100);
    const house2 = cityGraph.addBuilding('house', centerX + 200, centerY + 150);

    // Connections
    if (house1 && hospital) {
      cityGraph.addConnection(house1.id, hospital.id, 'road');
    }
    if (hospital && school) {
      cityGraph.addConnection(hospital.id, school.id, 'road');
    }
    if (school && shop) {
      cityGraph.addConnection(school.id, shop.id, 'metro');
    }
    if (shop && house2) {
      cityGraph.addConnection(shop.id, house2.id, 'road');
    }

    // A separate region
    const isolatedHouse = cityGraph.addBuilding('house', centerX - 300, centerY + 200);

    drawCity();
    updateUI();

    console.log('Sample city created with 6 buildings.');
    showMessage('Sample city created successfully!', 'success');
  }
}

function loadFromLocalStorage() {
  if (!cityGraph) return;

  if (cityGraph.loadFromLocalStorage()) {
    console.log('City loaded from localStorage.');
    drawCity();
    updateUI();
  } else {
    console.log('No saved city found.');
  }
}

function syncChallengeData() {
  // Get old data from cityGraph
  const cityGraphChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '[]');

  // Get old data from challengeManager
  const oldTopolabChallenges = JSON.parse(localStorage.getItem('topolab_challenges') || '[]');

  // Merge (without duplicates)
  const allChallenges = [...new Set([...cityGraphChallenges, ...oldTopolabChallenges])];

  // Save to new location
  localStorage.setItem('completedChallenges', JSON.stringify(allChallenges));

  // Remove old data
  localStorage.removeItem('topolab_challenges');

  console.log('Challenge data synchronized:', allChallenges);
}

// General events

// Add event to challenge start buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-start-challenge') ||
    e.target.closest('.btn-start-challenge')) {
    const challengeCard = e.target.closest('.challenge-card');
    if (challengeCard) {
      const challengeId = parseInt(challengeCard.dataset.challenge);
      startChallenge(challengeId);
    }
  }

  // Show challenge hint
  if (e.target.classList.contains('show-hint') ||
    e.target.closest('.show-hint')) {
    const challengeCard = e.target.closest('.challenge-card');
    if (challengeCard) {
      const hint = challengeCard.querySelector('.hint');
      if (hint) {
        hint.style.display = hint.style.display === 'block' ? 'none' : 'block';
      }
    }
  }
});

// Close challenges panel
document.getElementById('closeChallengesBtn')?.addEventListener('click', function() {
  document.getElementById('challengesPanel').style.display = 'none';
});

// Debug functions
window.debug = {
  logCityState: () => {
    if (!cityGraph) {
      console.log('CityGraph not defined');
      return;
    }

    console.log('=== City State ===');
    console.log('Buildings:', cityGraph.buildings.length);
    console.log('Connections:', cityGraph.connections.length);
    console.log('Connected?', cityGraph.isCityConnected());

    const analysis = cityGraph.analyzeCity();
    console.log('Full analysis:', analysis);
  },
  createSampleCity,
  clearCity: () => {
    if (cityGraph) {
      cityGraph.clearCity();
      drawCity();
      updateUI();
    }
  },
  addRandomBuilding: () => {
    if (cityGraph && canvas) {
      const x = 50 + Math.random() * (canvas.width - 100);
      const y = 50 + Math.random() * (canvas.height - 100);
      const types = ['house', 'hospital', 'school', 'shop', 'factory', 'park'];
      const type = types[Math.floor(Math.random() * types.length)];
      cityGraph.addBuilding(type, x, y);
      drawCity();
      updateUI();
    }
  }
};

console.log('To access debug functions, use window.debug.');
