export const exportAnalyticsToCSV = (activitiesData, activeTab) => {
  if (!activitiesData || activitiesData.length === 0) return;

  const headers = ['Activity', 'Average / Total', 'Label', 'Trend'];
  const rows = activitiesData.map(act => {
    const name = `"${(act.name || '').replace(/"/g, '""')}"`;
    const value = `"${String(act.value || 0).replace(/"/g, '""')}"`;
    const label = `"${(act.label || '').replace(/"/g, '""')}"`;
    const trend = `"${(act.trend || '').replace(/"/g, '""')}"`;
    return [name, value, label, trend].join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `analytics_export_${formatPeriod(activeTab)}.csv`);
};

export const exportAnalyticsToExcel = (activitiesData, activeTab) => {
  if (!activitiesData || activitiesData.length === 0) return;

  // Build an HTML table for Excel
  let table = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
  table += '<head><meta charset="UTF-8"></head><body>';
  table += '<table border="1"><tr>';
  table += '<th>Activity</th><th>Average / Total</th><th>Label</th><th>Trend</th></tr>';
  
  activitiesData.forEach(act => {
    table += `<tr>
      <td>${escapeHTML(act.name)}</td>
      <td>${escapeHTML(String(act.value || 0))}</td>
      <td>${escapeHTML(act.label)}</td>
      <td>${escapeHTML(act.trend)}</td>
    </tr>`;
  });
  
  table += '</table></body></html>';
  
  const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, `analytics_export_${formatPeriod(activeTab)}.xls`);
};

export const printAnalyticsToPDF = (activitiesData, activeTab, userName = 'Student') => {
  if (!activitiesData || activitiesData.length === 0) return;

  const dateStr = new Date().toLocaleDateString();
  const periodText = activeTab === '7 Days' ? 'Last 7 Days' : (activeTab === '30 Days' ? 'Last 30 Days' : 'Custom Range');

  let html = `
    <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; }
          h1 { color: #0f172a; margin-bottom: 5px; }
          .meta { color: #64748b; margin-bottom: 30px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 12px; }
          .trend-stable { color: #1a73e8; font-weight: bold; }
          .trend-improved { color: #16a34a; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Sadhana Analytics Report</h1>
        <div class="meta">
          <strong>Period:</strong> ${periodText}<br>
          <strong>Generated:</strong> ${dateStr}
        </div>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Average / Total</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
  `;

  activitiesData.forEach(act => {
    const trendClass = act.trend === 'Stable' ? 'trend-stable' : 'trend-improved';
    html += `
      <tr>
        <td style="font-weight: bold;">${escapeHTML(act.name)}</td>
        <td>
           <span style="font-size: 18px; font-weight: bold;">${escapeHTML(String(act.value || 0))}</span> 
           <span style="color: #64748b; font-size: 14px;">${escapeHTML(act.label)}</span>
        </td>
        <td class="${trendClass}">${escapeHTML(act.trend)}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Create invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

// Wait for iframe content to render, then print
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

export const exportBulkReportsToCSV = (reportsData, filename) => {
  if (!reportsData || reportsData.length === 0) return;

  const headers = ['Student Name', 'Center', 'Sub-Group', 'Date', 'Activity', 'Value', 'Marks'];
  const rows = reportsData.map(row => {
    return [
      `"${(row.student_name || '').replace(/"/g, '""')}"`,
      `"${(row.center_name || '').replace(/"/g, '""')}"`,
      `"${(row.label_name || '').replace(/"/g, '""')}"`,
      `"${(row.activity_date || '').replace(/"/g, '""')}"`,
      `"${(row.activity_name || '').replace(/"/g, '""')}"`,
      `"${String(row.activity_value ?? 0).replace(/"/g, '""')}"`,
      `"${String(row.activity_marks ?? 0).replace(/"/g, '""')}"`
    ].join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
};

export const exportBulkReportsToExcel = (reportsData, filename) => {
  if (!reportsData || reportsData.length === 0) return;

  let table = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
  table += '<head><meta charset="UTF-8"></head><body>';
  table += '<table border="1"><tr>';
  table += '<th>Student Name</th><th>Center</th><th>Sub-Group</th><th>Date</th><th>Activity</th><th>Value</th><th>Marks</th></tr>';
  
  reportsData.forEach(row => {
    table += `<tr>
      <td>${escapeHTML(row.student_name)}</td>
      <td>${escapeHTML(row.center_name)}</td>
      <td>${escapeHTML(row.label_name)}</td>
      <td>${escapeHTML(row.activity_date)}</td>
      <td>${escapeHTML(row.activity_name)}</td>
      <td>${escapeHTML(String(row.activity_value ?? 0))}</td>
      <td>${escapeHTML(String(row.activity_marks ?? 0))}</td>
    </tr>`;
  });
  
  table += '</table></body></html>';
  
  const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, filename);
};

export const exportBulkReportsToPDF = (reportsData, durationLabel, filename) => {
  if (!reportsData || reportsData.length === 0) return;

  const dateStr = new Date().toLocaleDateString();

  let html = `
    <html>
      <head>
        <title>Bulk Students Activity Report</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; }
          h1 { color: #0f172a; margin-bottom: 5px; }
          .meta { color: #64748b; margin-bottom: 30px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h1>Bulk Students Activity Report</h1>
        <div class="meta">
          <strong>Period:</strong> ${escapeHTML(durationLabel)}<br>
          <strong>Generated:</strong> ${dateStr}
        </div>
        <table>
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>CENTER / SUB-GROUP</th>
              <th>DATE</th>
              <th>ACTIVITY</th>
              <th>VALUE</th>
              <th>MARKS</th>
            </tr>
          </thead>
          <tbody>
            ${reportsData.map(row => `
              <tr>
                <td style="font-weight: 700;">${escapeHTML(row.student_name)}</td>
                <td>${escapeHTML(row.center_name || 'N/A')} / ${escapeHTML(row.label_name || 'N/A')}</td>
                <td>${escapeHTML(row.activity_date)}</td>
                <td style="color: #3b82f6;">${escapeHTML(row.activity_name)}</td>
                <td style="font-weight: 700;">${escapeHTML(String(row.activity_value ?? 0))}</td>
                <td style="font-weight: 700; color: #10b981;">${escapeHTML(String(row.activity_marks ?? 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

// Utilities
const formatPeriod = (activeTab) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const period = activeTab.replace(/\s+/g, '_').toLowerCase();
  return `${period}_${dateStr}`;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeHTML = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
