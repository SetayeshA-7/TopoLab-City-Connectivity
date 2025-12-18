class ReportGenerator {
  constructor(cityGraph) {
    this.cityGraph = cityGraph;
  }

  generateReport() {
    const analysis = this.cityGraph.analyzeCity();
    const challenges = challengeManager.getProgress();

    return {
      title: "TopoLab City Analysis Report",
      timestamp: new Date().toLocaleString('en-US'),
      analysis: {
        connectivity: analysis.isConnected ? "Connected" : "Disconnected",
        buildingCount: analysis.buildingCount,
        connectionCount: analysis.connectionCount,
        componentCount: analysis.componentCount,
        connectivityIndex: analysis.connectivityIndex,
        largestComponent: analysis.largestComponent
      },
      challenges: {
        completed: challenges.completed,
        total: challenges.total,
        percentage: challenges.percentage
      },
      recommendations: this.getRecommendations(analysis),
      educationalInsights: this.getEducationalInsights(analysis)
    };
  }

  getRecommendations(analysis) {
    const recommendations = [];

    if (!analysis.isConnected) {
      recommendations.push({
        priority: "High",
        text: "Create connections between separate components.",
        reason: "City is divided into multiple disconnected regions."
      });
    }

    if (analysis.isolatedBuildings && analysis.isolatedBuildings.length > 0) {
      recommendations.push({
        priority: "High",
        text: `${analysis.isolatedBuildings.length} isolated buildings need connections.`,
        reason: "Isolated buildings don't have access to services."
      });
    }

    if (analysis.accessIssues && analysis.accessIssues.length > 0) {
      recommendations.push({
        priority: "High",
        text: "Improve access to essential services.",
        reason: `${analysis.accessIssues.length} access issues identified.`
      });
    }

    if (analysis.vulnerableConnections && analysis.vulnerableConnections.length > 0) {
      recommendations.push({
        priority: "Medium",
        text: "Create alternative paths for vulnerable connections.",
        reason: `${analysis.vulnerableConnections.length} critical connections found.`
      });
    }

    if (analysis.connectivityIndex < 0.3) {
      recommendations.push({
        priority: "Medium",
        text: "Increase connection density.",
        reason: "City's connectivity coefficient is low."
      });
    }

    return recommendations;
  }

  getEducationalInsights(analysis) {
    const insights = [];

    // Always add main connectivity insight
    if (analysis.isConnected) {
      insights.push({
        concept: "Connectivity",
        explanation: "Your city is connected, meaning you can travel from any building to any other building. In mathematics, a space that cannot be divided into two disjoint open sets is called connected."
      });

      // For connected cities, add extra insight
      if (analysis.vulnerableConnections && analysis.vulnerableConnections.length === 0) {
        insights.push({
          concept: "Network Resilience",
          explanation: "Your city has a resilient network where removing any connection won't disconnect it. This concept is important in computer network engineering."
        });
      }
    } else {
      insights.push({
        concept: "Disconnectedness",
        explanation: `Your city is disconnected and divided into ${analysis.componentCount} connected components. This concept in topology indicates the presence of barriers or separations in space.`
      });
    }

    // Insight for isolated buildings
    if (analysis.isolatedBuildings && analysis.isolatedBuildings.length > 0) {
      insights.push({
        concept: "Isolated Points",
        explanation: `${analysis.isolatedBuildings.length} buildings are completely isolated. In graph theory, these are points with degree zero and no connections.`
      });
    }

    // Insight for vulnerable connections
    if (analysis.vulnerableConnections && analysis.vulnerableConnections.length > 0) {
      insights.push({
        concept: "Critical Connections",
        explanation: `${analysis.vulnerableConnections.length} critical connections exist where removing any one would disconnect the city. In graph theory, these connections are called 'bridges'.`
      });
    }

    // Insight for connectivity index
    if (analysis.connectivityIndex >= 0.7) {
      insights.push({
        concept: "Dense Network",
        explanation: `Connectivity coefficient of ${analysis.connectivityIndex} indicates your city has a dense network. In such networks, information travels faster.`
      });
    } else if (analysis.connectivityIndex < 0.3) {
      insights.push({
        concept: "Sparse Network",
        explanation: `Connectivity coefficient of ${analysis.connectivityIndex} indicates your city has a sparse network. Adding more connections can increase reliability.`
      });
    }

    // If no insights, add a general one
    if (insights.length === 0) {
      insights.push({
        concept: "Basic Concepts",
        explanation: "Connectivity is one of the fundamental concepts in topology and graph theory with wide applications in computer networks, geography, and urban planning."
      });
    }

    return insights;
  }

  generateHTMLReport() {
    const report = this.generateReport();

    // Determine status based on building count
    let statusText, statusClass, statusIcon;

    if (report.analysis.buildingCount === 0) {
      statusText = "Empty City";
      statusClass = "empty";
      statusIcon = "📭";
    } else if (report.analysis.buildingCount === 1) {
      statusText = "Single Building";
      statusClass = "single";
      statusIcon = "🏢";
    } else {
      statusText = report.analysis.connectivity;
      statusClass = report.analysis.connectivity === "Connected" ? "connected" : "disconnected";
      statusIcon = report.analysis.connectivity === "Connected" ? "✅" : "❌";
    }

    return `
    <div class="report">
      <h2>${report.title}</h2>
      <p class="timestamp">Generated: ${report.timestamp}</p>

      <!-- 📊 Analysis Summary Section -->
      <div class="section">
        <h3><i class="fas fa-chart-bar"></i> Analysis Summary</h3>
        <div class="analysis-summary-box">

          <!-- Row 1: Status -->
          <div class="summary-row row-1">
            <div class="summary-item full-width">
              <span class="summary-label">Status</span>
              <span class="summary-value ${statusClass}">
                ${statusText} ${statusIcon}
              </span>
            </div>
          </div>

          <!-- Row 2: Buildings & Connections -->
          <div class="summary-row row-2">
            <div class="summary-item">
              <span class="summary-label">Buildings</span>
              <span class="summary-value">${report.analysis.buildingCount}</span>
              <div class="summary-icon">🏢</div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-item">
              <span class="summary-label">Connections</span>
              <span class="summary-value">${report.analysis.connectionCount}</span>
              <div class="summary-icon">🛣️</div>
            </div>
          </div>

          <!-- Row 3: Components & Connectivity Index -->
          <div class="summary-row row-3">
            <div class="summary-item">
              <span class="summary-label">Components</span>
              <span class="summary-value">${report.analysis.componentCount}</span>
              <div class="summary-icon">🔗</div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-item">
              <span class="summary-label">Connectivity Index</span>
              <span class="summary-value">${report.analysis.connectivityIndex}</span>
              <div class="summary-icon">📈</div>
            </div>
          </div>

        </div>

        <!-- Educational note for single building -->
        ${report.analysis.buildingCount === 1 ? `
          <div class="educational-note">
            <p><strong>🎓 Educational Note:</strong> Mathematically, a single point is considered connected
            (since it cannot be divided into two disjoint open subsets). But for practical
            connectivity analysis in a city, at least 2 points are needed.</p>
          </div>
        ` : ''}

        ${report.analysis.buildingCount === 0 ? `
          <div class="educational-note">
            <p><strong>🎯 Note:</strong> City is empty. Add buildings to perform connectivity analysis.</p>
          </div>
        ` : ''}

      </div>

      <!-- Only show other sections if more than 1 building -->
      ${report.analysis.buildingCount > 1 ? `
        <div class="section">
          <h3><i class="fas fa-lightbulb"></i> Improvement Recommendations</h3>
          <div class="recommendations">
            ${report.recommendations.length > 0 ?
      report.recommendations.map(rec => `
                <div class="recommendation priority-${rec.priority === "High" ? "high" : "medium"}">
                  <span class="priority-badge">${rec.priority}</span>
                  <p>${rec.text}</p>
                  <small>${rec.reason}</small>
                </div>
              `).join('')
      : `
              <div class="recommendation">
                <p>Your city has optimal connectivity! 🎉</p>
                <small>No improvement recommendations needed.</small>
              </div>
            `}
          </div>
        </div>

        <div class="section">
          <h3><i class="fas fa-graduation-cap"></i> Educational Insights</h3>
          <div class="insights">
            ${report.educationalInsights.map(insight => `
              <div class="insight">
                <h4>${insight.concept}</h4>
                <p>${insight.explanation}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <h3><i class="fas fa-trophy"></i> Challenge Progress</h3>
          <div class="challenge-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${report.challenges.percentage}%"></div>
            </div>
            <p>${report.challenges.completed} of ${report.challenges.total} challenges completed (${report.challenges.percentage}%)</p>
          </div>
        </div>
      ` : `
        <!-- If 0 or 1 building, show encouragement -->
        <div class="section">
          <h3><i class="fas fa-rocket"></i> Next Steps</h3>
          <div class="next-step">
            <p>To start connectivity analysis:</p>
            <ol>
              <li>Add more buildings.</li>
              <li>Create connections between buildings.</li>
              <li>Click "Analyze Connectivity" button.</li>
            </ol>
            <p class="tip">💡 <strong>Tip:</strong> Connectivity becomes meaningful when we have at least 2 points and check if there's a path between them.</p>
          </div>
        </div>
      `}

      <div class="footer">
        <p>This report was generated by TopoLab software.</p>
        <p>Purpose: Teaching connectivity and disconnectedness concepts in mathematics.</p>
      </div>
    </div>
  `;
  }

  shareReport() {
    const report = this.generateReport();
    const text = `TopoLab Report:
Status: ${report.analysis.connectivity}
Buildings: ${report.analysis.buildingCount}
Connections: ${report.analysis.connectionCount}
Components: ${report.analysis.componentCount}
Challenges Completed: ${report.challenges.completed}/${report.challenges.total}

View full report: ${window.location.href}`;

    if (navigator.share) {
      navigator.share({
        title: report.title,
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("Report copied to clipboard!");
      });
    }
  }

  exportAsPDF() {
    alert("PDF export feature available.");
  }
}

// Add to window
window.ReportGenerator = ReportGenerator;
