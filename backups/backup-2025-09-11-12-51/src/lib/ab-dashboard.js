// A/B Testing Dashboard for Admin View
export class ABDashboard {
  constructor() {
    this.results = this.loadResults();
  }

  // Load A/B test results from localStorage
  loadResults() {
    const events = JSON.parse(localStorage.getItem('ab_events') || '[]');
    return this.processEvents(events);
  }

  // Process events into meaningful results
  processEvents(events) {
    const results = {
      tests: {},
      conversions: {},
      engagement: {}
    };

    events.forEach(event => {
      const { event: eventName, data, timestamp } = event;
      
      if (eventName === 'ab_test_assignment') {
        const { test_name, variant } = data;
        if (!results.tests[test_name]) {
          results.tests[test_name] = { variants: {} };
        }
        if (!results.tests[test_name].variants[variant]) {
          results.tests[test_name].variants[variant] = { 
            assignments: 0, 
            conversions: 0,
            engagement: 0 
          };
        }
        results.tests[test_name].variants[variant].assignments++;
      }
      
      if (eventName === 'ab_test_conversion') {
        const { test_name, variant, conversion_type, conversion_value } = data;
        if (!results.conversions[test_name]) {
          results.conversions[test_name] = {};
        }
        if (!results.conversions[test_name][variant]) {
          results.conversions[test_name][variant] = {};
        }
        if (!results.conversions[test_name][variant][conversion_type]) {
          results.conversions[test_name][variant][conversion_type] = 0;
        }
        results.conversions[test_name][variant][conversion_type] += conversion_value;
      }
    });

    return results;
  }

  // Generate dashboard HTML
  generateDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'ab-dashboard';
    dashboard.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: white;
        border: 2px solid #ff6b35;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        overflow-y: auto;
        font-family: Arial, sans-serif;
        font-size: 14px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; color: #ff6b35;">A/B Testing Dashboard</h3>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
          ">×</button>
        </div>
        
        <div id="ab-results">
          ${this.generateResultsHTML()}
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
          <button onclick="abDashboard.refreshResults()" style="
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            margin-right: 10px;
          ">Refresh</button>
          <button onclick="abDashboard.exportResults()" style="
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
          ">Export CSV</button>
        </div>
      </div>
    `;
    
    return dashboard;
  }

  // Generate results HTML
  generateResultsHTML() {
    let html = '';
    
    Object.keys(this.results.tests).forEach(testName => {
      const test = this.results.tests[testName];
      html += `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">${testName.replace(/_/g, ' ').toUpperCase()}</h4>
      `;
      
      Object.keys(test.variants).forEach(variant => {
        const variantData = test.variants[variant];
        const conversions = this.results.conversions[testName]?.[variant] || {};
        const totalConversions = Object.values(conversions).reduce((sum, val) => sum + val, 0);
        const conversionRate = variantData.assignments > 0 ? (totalConversions / variantData.assignments * 100).toFixed(2) : 0;
        
        html += `
          <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
            <strong>${variant}</strong><br>
            <span style="color: #666;">Assignments: ${variantData.assignments}</span><br>
            <span style="color: #666;">Conversions: ${totalConversions}</span><br>
            <span style="color: #ff6b35; font-weight: bold;">Rate: ${conversionRate}%</span>
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    if (html === '') {
      html = '<p style="color: #666; text-align: center;">No A/B test data available yet. Visit some pages to generate data.</p>';
    }
    
    return html;
  }

  // Show dashboard (only for localhost)
  showDashboard() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Remove existing dashboard
      const existing = document.getElementById('ab-dashboard');
      if (existing) existing.remove();
      
      // Add new dashboard
      document.body.appendChild(this.generateDashboard());
    }
  }

  // Refresh results
  refreshResults() {
    this.results = this.loadResults();
    const resultsDiv = document.getElementById('ab-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = this.generateResultsHTML();
    }
  }

  // Export results as CSV
  exportResults() {
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Generate CSV data
  generateCSV() {
    let csv = 'Test Name,Variant,Assignments,Conversions,Conversion Rate\n';
    
    Object.keys(this.results.tests).forEach(testName => {
      const test = this.results.tests[testName];
      Object.keys(test.variants).forEach(variant => {
        const variantData = test.variants[variant];
        const conversions = this.results.conversions[testName]?.[variant] || {};
        const totalConversions = Object.values(conversions).reduce((sum, val) => sum + val, 0);
        const conversionRate = variantData.assignments > 0 ? (totalConversions / variantData.assignments * 100).toFixed(2) : 0;
        
        csv += `${testName},${variant},${variantData.assignments},${totalConversions},${conversionRate}%\n`;
      });
    });
    
    return csv;
  }
}

// Global instance
export const abDashboard = new ABDashboard();

// Show dashboard on Ctrl+Shift+A
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    abDashboard.showDashboard();
  }
});
