import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiBarChart2,
  FiCamera,
  FiCheckSquare,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiImage,
  FiRefreshCw,
  FiStar,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import Toast from '../../components/Toast';
import { api, API_BASE_URL } from '../../utils/api';

const EMPTY_ROW = { item_source: '', expenditure: '', total_expenditure: '', outstanding_balance: '', balance: '' };

const resolveMediaUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

const sectionCardStyle = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 18px rgba(15, 23, 42, 0.08)',
  padding: '22px 24px',
  marginBottom: 24,
  border: '1px solid #e8eef8',
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  color: '#0f3d75',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.5px solid #dde3f0',
  fontSize: '0.88rem',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const toolbarButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  borderRadius: 8,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.86rem',
};

const formatCurrency = (value) => Number(value || 0).toLocaleString();

const reportHtml = (report, year) => {
  const imageList = (title, images = []) => images.length
    ? `
      <section>
        <h3>${title}</h3>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          ${images.map((img) => `
            <figure style="margin:0;">
              <img src="${resolveMediaUrl(img.url)}" alt="${img.caption || title}" style="width:180px;height:140px;object-fit:cover;border-radius:8px;border:1px solid #dbe4f0;" />
              ${img.caption ? `<figcaption style="margin-top:6px;font-size:12px;color:#475569;">${img.caption}</figcaption>` : ''}
            </figure>
          `).join('')}
        </div>
      </section>
    `
    : '';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>SPE UDOM Annual Report ${year}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; line-height: 1.6; }
          h1, h2, h3 { color: #0f3d75; }
          h1 { margin-bottom: 8px; }
          h2 { margin-top: 28px; border-bottom: 2px solid #dbeafe; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #dbe4f0; padding: 10px; text-align: left; }
          th { background: #eff6ff; }
          .meta { color: #64748b; margin-bottom: 20px; }
          .image-row { display: flex; gap: 12px; flex-wrap: wrap; }
        </style>
      </head>
      <body>
        <h1>SPE UDOM Annual Report</h1>
        <div class="meta">Academic Year: ${year}</div>

        <h2>1. President's Message</h2>
        <p>${report?.president_message || 'No content available.'}</p>
        ${report?.president_image ? `<img src="${resolveMediaUrl(report.president_image)}" alt="President" style="max-width:220px;border-radius:10px;border:1px solid #dbe4f0;" />` : ''}

        <h2>2. Membership Statistics</h2>
        <p>${report?.membership_statistics || 'No content available.'}</p>
        ${report?.membership_chart ? `<img src="${resolveMediaUrl(report.membership_chart)}" alt="Membership Chart" style="max-width:320px;border-radius:10px;border:1px solid #dbe4f0;" />` : ''}

        <h2>3. Financial Status</h2>
        <table>
          <thead>
            <tr>
              <th>Item / Source</th>
              <th>Expenditure</th>
              <th>Total Expenditure</th>
              <th>Outstanding Balance</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${(report?.financial_items || []).map((row) => `
              <tr>
                <td>${row.item_source}</td>
                <td>${formatCurrency(row.expenditure)}</td>
                <td>${formatCurrency(row.total_expenditure)}</td>
                <td>${formatCurrency(row.outstanding_balance)}</td>
                <td>${formatCurrency(row.balance)}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">No financial items available.</td></tr>'}
          </tbody>
        </table>

        <h2>4. Events</h2>
        <h3>Technical Dissemination & Professional Development</h3>
        <p>${report?.technical_dissemination || 'No content available.'}</p>
        ${imageList('Technical Activity Photos', report?.technical_images)}

        <h3>Community Engagement</h3>
        <p>${report?.community_engagement || 'No content available.'}</p>
        ${imageList('Community Engagement Photos', report?.community_images)}

        <h3>Member Recognition & Appreciation</h3>
        <p>${report?.member_recognition || 'No content available.'}</p>
        ${imageList('Recognition Photos', report?.recognition_images)}

        <h2>5. Challenges</h2>
        <p>${report?.challenges || 'No content available.'}</p>

        <h2>6. Recommendations</h2>
        <p>${report?.recommendations || 'No content available.'}</p>
      </body>
    </html>
  `;
};

const downloadReportFile = (report, year) => {
  const blob = new Blob([reportHtml(report, year)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spe-udom-annual-report-${year.replace('/', '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

const SectionTitle = ({ icon: Icon, children }) => (
  <div style={sectionHeaderStyle}>
    <span style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0f3d75' }}>
      <Icon size={18} />
    </span>
    <h3 style={{ margin: 0, fontSize: '1rem' }}>{children}</h3>
  </div>
);

const ReadonlyText = ({ value, placeholder }) => (
  <div style={{ whiteSpace: 'pre-wrap', color: value ? '#334155' : '#94a3b8', minHeight: 28 }}>
    {value || placeholder}
  </div>
);

const ImageUploadBox = ({ label, images, onUpload, onDelete, canEdit }) => {
  const ref = useRef(null);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>{label}</span>
        {canEdit && (
          <>
            <button
              type="button"
              style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff', padding: '8px 12px', fontSize: '0.78rem' }}
              onClick={() => ref.current?.click()}
            >
              <FiCamera size={15} />
              Upload Image
            </button>
            <input
              ref={ref}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) onUpload(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>
      {images.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative', width: 104, height: 104 }}>
              <img
                src={resolveMediaUrl(img.url)}
                alt={img.caption || label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: '1px solid #dde3f0' }}
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(img.id)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(220,38,38,0.92)', color: '#fff', cursor: 'pointer' }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#94a3b8', fontSize: '0.84rem' }}>No images uploaded.</div>
      )}
    </div>
  );
};

const AnnualReportPage = ({ canEdit = false, title = 'Annual Report' }) => {
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState(EMPTY_ROW);

  const [presidentMessage, setPresidentMessage] = useState('');
  const [membershipStats, setMembershipStats] = useState('');
  const [technicalText, setTechnicalText] = useState('');
  const [communityText, setCommunityText] = useState('');
  const [recognitionText, setRecognitionText] = useState('');
  const [challengesText, setChallengesText] = useState('');
  const [recommendationsText, setRecommendationsText] = useState('');
  const [presidentImageFile, setPresidentImageFile] = useState(null);
  const [membershipChartFile, setMembershipChartFile] = useState(null);

  const presidentImageRef = useRef(null);
  const membershipChartRef = useRef(null);

  const syncReport = (data) => {
    setReport(data);
    setPresidentMessage(data?.president_message || '');
    setMembershipStats(data?.membership_statistics || '');
    setTechnicalText(data?.technical_dissemination || '');
    setCommunityText(data?.community_engagement || '');
    setRecognitionText(data?.member_recognition || '');
    setChallengesText(data?.challenges || '');
    setRecommendationsText(data?.recommendations || '');
    setPresidentImageFile(null);
    setMembershipChartFile(null);
  };

  useEffect(() => {
    const loadYears = async () => {
      const { ok, data } = await api('/leadership/years/');
      if (ok) {
        const ys = data.years || [];
        setYears(ys);
        if (ys.length) setActiveYear(ys[ys.length - 1]);
      }
    };
    loadYears();
  }, []);

  useEffect(() => {
    const loadReport = async () => {
      if (!activeYear) return;
      setLoading(true);
      const { ok, data, status } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/`);
      if (ok) syncReport(data);
      else if (status === 404) syncReport(null);
      else setToast({ message: data?.error || 'Failed to load annual report.', type: 'error' });
      setLoading(false);
    };
    loadReport();
  }, [activeYear]);

  const financialItems = useMemo(() => report?.financial_items || [], [report]);
  const totalExpenditure = useMemo(
    () => financialItems.reduce((sum, row) => sum + parseFloat(row.total_expenditure || 0), 0),
    [financialItems]
  );
  const totalBalance = useMemo(
    () => financialItems.reduce((sum, row) => sum + parseFloat(row.balance || 0), 0),
    [financialItems]
  );

  const saveSection = async (fields) => {
    if (!canEdit) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) fd.append(key, value);
    });
    const { ok, data } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/`, { method: 'POST', body: fd, headers: {} });
    setSaving(false);
    if (ok) {
      const refreshed = await api(`/annual-reports/${encodeURIComponent(activeYear)}/`);
      if (refreshed.ok) syncReport(refreshed.data);
      setToast({ message: 'Annual report updated.', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Save failed.', type: 'error' });
    }
  };

  const uploadSectionImage = async (section, file) => {
    if (!canEdit) return;
    const fd = new FormData();
    fd.append('image', file);
    const { ok, data } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/images/${section}/`, { method: 'POST', body: fd, headers: {} });
    if (ok) {
      setReport((prev) => ({ ...prev, [`${section}_images`]: [...(prev?.[`${section}_images`] || []), data] }));
      setToast({ message: 'Image uploaded.', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Image upload failed.', type: 'error' });
    }
  };

  const deleteImage = async (imageId, section) => {
    if (!canEdit) return;
    const { ok, data } = await api(`/annual-reports/images/${imageId}/`, { method: 'DELETE' });
    if (ok) {
      setReport((prev) => ({ ...prev, [`${section}_images`]: (prev?.[`${section}_images`] || []).filter((img) => img.id !== imageId) }));
      setToast({ message: 'Image removed.', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Failed to delete image.', type: 'error' });
    }
  };

  const addFinancialRow = async () => {
    if (!canEdit) return;
    if (!newRow.item_source.trim()) {
      setToast({ message: 'Item / Source is required.', type: 'error' });
      return;
    }
    const { ok, data } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/financial/`, {
      method: 'POST',
      body: JSON.stringify(newRow),
    });
    if (ok) {
      setReport((prev) => ({ ...prev, financial_items: [...(prev?.financial_items || []), data] }));
      setNewRow(EMPTY_ROW);
      setToast({ message: 'Financial row added.', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Failed to add row.', type: 'error' });
    }
  };

  const saveEditRow = async () => {
    if (!canEdit) return;
    const { ok, data } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/financial/`, {
      method: 'PUT',
      body: JSON.stringify({ id: editRowId, ...editRowData }),
    });
    if (ok) {
      setReport((prev) => ({
        ...prev,
        financial_items: (prev?.financial_items || []).map((row) => (row.id === editRowId ? data : row)),
      }));
      setEditRowId(null);
      setToast({ message: 'Financial row updated.', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Failed to update row.', type: 'error' });
    }
  };

  const deleteYear = async () => {
    if (!canEdit || !activeYear) return;
    if (!window.confirm(`Permanently delete the entire report for ${activeYear}? This cannot be undone.`)) return;
    const { ok, data } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/`, { method: 'DELETE' });
    if (ok) {
      const remaining = years.filter(y => y !== activeYear);
      setYears(remaining);
      setActiveYear(remaining.length ? remaining[remaining.length - 1] : '');
      syncReport(null);
      setToast({ message: `Report for ${activeYear} deleted.`, type: 'success' });
    } else {
      setToast({ message: data?.error || 'Failed to delete year.', type: 'error' });
    }
  };

  const deleteFinancialRow = async (id) => {
    if (!canEdit) return;
    const { ok, data } = await api(`/annual-reports/${encodeURIComponent(activeYear)}/financial/`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    if (ok) {
      setReport((prev) => ({ ...prev, financial_items: (prev?.financial_items || []).filter((row) => row.id !== id) }));
      setToast({ message: 'Financial row deleted.', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Failed to delete row.', type: 'error' });
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFileText size={24} color="#0f62c9" />
            {title}
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {canEdit ? 'Only the General Secretary can update this report.' : 'View and download the annual report.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Select the year to View and download the annual report.</label>
            <select
            value={activeYear}
            onChange={(e) => setActiveYear(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', minWidth: 160, fontWeight: 700 }}
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          </div>
          <button
            type="button"
            style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff' }}
            onClick={() => report && downloadReportFile(report, activeYear)}
            disabled={!report}
          >
            <FiDownload size={16} />
            Download
          </button>
          {canEdit && activeYear && (
            <button
              type="button"
              style={{ ...toolbarButtonStyle, background: '#dc2626', color: '#fff' }}
              onClick={deleteYear}
            >
              <FiTrash2 size={16} />
              Delete Year
            </button>
          )}
          {saving && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f62c9', fontWeight: 700, fontSize: '0.85rem' }}>
              <FiRefreshCw size={15} />
              Saving...
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div style={sectionCardStyle}>Loading annual report...</div>
      ) : !report ? (
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b' }}>
            <FiAlertCircle size={18} />
            <span>{canEdit ? 'No report exists for this year yet. Start filling the sections below.' : 'No annual report is available for this year yet.'}</span>
          </div>
        </div>
      ) : null}

      <div style={sectionCardStyle}>
        <SectionTitle icon={FiEdit3}>1. President's Message</SectionTitle>
        {canEdit ? (
          <>
            <textarea value={presidentMessage} onChange={(e) => setPresidentMessage(e.target.value)} rows={5} style={{ ...inputStyle, marginBottom: 10 }} placeholder="Write the president's message..." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" style={{ ...toolbarButtonStyle, background: '#e8f1ff', color: '#0f62c9' }} onClick={() => presidentImageRef.current?.click()}>
                <FiImage size={16} />
                Upload President Photo
              </button>
              <input ref={presidentImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPresidentImageFile(e.target.files?.[0] || null)} />
              {presidentImageFile && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{presidentImageFile.name}</span>}
              {report?.president_image && !presidentImageFile && <img src={resolveMediaUrl(report.president_image)} alt="President" style={{ height: 52, borderRadius: 10, border: '1px solid #dde3f0' }} />}
              <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff' }} onClick={() => saveSection({ president_message: presidentMessage, ...(presidentImageFile ? { president_image: presidentImageFile } : {}) })}>
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <ReadonlyText value={report?.president_message} placeholder="No president's message available." />
            {report?.president_image && <img src={resolveMediaUrl(report.president_image)} alt="President" style={{ marginTop: 12, maxWidth: 240, borderRadius: 10, border: '1px solid #dde3f0' }} />}
          </>
        )}
      </div>

      <div style={sectionCardStyle}>
        <SectionTitle icon={FiUsers}>2. Membership Statistics</SectionTitle>
        {canEdit ? (
          <>
            <textarea value={membershipStats} onChange={(e) => setMembershipStats(e.target.value)} rows={4} style={{ ...inputStyle, marginBottom: 10 }} placeholder="Summarize membership statistics..." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" style={{ ...toolbarButtonStyle, background: '#e8f1ff', color: '#0f62c9' }} onClick={() => membershipChartRef.current?.click()}>
                <FiBarChart2 size={16} />
                Upload Chart
              </button>
              <input ref={membershipChartRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setMembershipChartFile(e.target.files?.[0] || null)} />
              {membershipChartFile && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{membershipChartFile.name}</span>}
              {report?.membership_chart && !membershipChartFile && <img src={resolveMediaUrl(report.membership_chart)} alt="Membership chart" style={{ height: 52, borderRadius: 10, border: '1px solid #dde3f0' }} />}
              <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff' }} onClick={() => saveSection({ membership_statistics: membershipStats, ...(membershipChartFile ? { membership_chart: membershipChartFile } : {}) })}>
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <ReadonlyText value={report?.membership_statistics} placeholder="No membership statistics available." />
            {report?.membership_chart && <img src={resolveMediaUrl(report.membership_chart)} alt="Membership chart" style={{ marginTop: 12, maxWidth: 320, borderRadius: 10, border: '1px solid #dde3f0' }} />}
          </>
        )}
      </div>

      <div style={sectionCardStyle}>
        <SectionTitle icon={FiTrendingUp}>3. Financial Status</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#eff6ff' }}>
              {['Item / Source', 'Expenditure', 'Total Expenditure', 'Outstanding Balance', 'Balance', ...(canEdit ? ['Actions'] : [])].map((header) => (
                <th key={header} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #dbe4f0', color: '#0f3d75' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {financialItems.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                {editRowId === row.id ? (
                  <>
                    {['item_source', 'expenditure', 'total_expenditure', 'outstanding_balance', 'balance'].map((field) => (
                      <td key={field} style={{ padding: '8px' }}>
                        <input value={editRowData[field]} onChange={(e) => setEditRowData((prev) => ({ ...prev, [field]: e.target.value }))} style={{ ...inputStyle, padding: '6px 8px' }} />
                      </td>
                    ))}
                    <td style={{ padding: '8px', display: 'flex', gap: 6 }}>
                      <button type="button" style={{ ...toolbarButtonStyle, background: '#198754', color: '#fff', padding: '8px 10px' }} onClick={saveEditRow}>Save</button>
                      <button type="button" style={{ ...toolbarButtonStyle, background: '#e5e7eb', color: '#334155', padding: '8px 10px' }} onClick={() => setEditRowId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.item_source}</td>
                    <td style={{ padding: '10px 12px' }}>{formatCurrency(row.expenditure)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatCurrency(row.total_expenditure)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatCurrency(row.outstanding_balance)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: Number(row.balance) >= 0 ? '#198754' : '#dc2626' }}>{formatCurrency(row.balance)}</td>
                    {canEdit && (
                      <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                        <button type="button" style={{ ...toolbarButtonStyle, background: '#f59e0b', color: '#fff', padding: '8px 10px' }} onClick={() => { setEditRowId(row.id); setEditRowData({ item_source: row.item_source, expenditure: row.expenditure, total_expenditure: row.total_expenditure, outstanding_balance: row.outstanding_balance, balance: row.balance }); }}>
                          Edit
                        </button>
                        <button type="button" style={{ ...toolbarButtonStyle, background: '#dc2626', color: '#fff', padding: '8px 10px' }} onClick={() => deleteFinancialRow(row.id)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            {financialItems.length > 0 && (
              <tr style={{ background: '#f8fbff', fontWeight: 700 }}>
                <td style={{ padding: '10px 12px' }}>TOTAL</td>
                <td />
                <td style={{ padding: '10px 12px' }}>{formatCurrency(totalExpenditure)}</td>
                <td />
                <td style={{ padding: '10px 12px', color: totalBalance >= 0 ? '#198754' : '#dc2626' }}>{formatCurrency(totalBalance)}</td>
                {canEdit && <td />}
              </tr>
            )}
            {canEdit && (
              <tr style={{ background: '#f8fafc' }}>
                {['item_source', 'expenditure', 'total_expenditure', 'outstanding_balance', 'balance'].map((field) => (
                  <td key={field} style={{ padding: '8px' }}>
                    <input
                      value={newRow[field]}
                      placeholder={field === 'item_source' ? 'Item / Source' : '0'}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, [field]: e.target.value }))}
                      style={{ ...inputStyle, padding: '6px 8px' }}
                    />
                  </td>
                ))}
                <td style={{ padding: '8px' }}>
                  <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff', padding: '8px 10px' }} onClick={addFinancialRow}>
                    Add
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!financialItems.length && <div style={{ color: '#94a3b8', fontSize: '0.84rem' }}>No financial records yet.</div>}
      </div>

      <div style={sectionCardStyle}>
        <SectionTitle icon={FiCheckSquare}>4. Events</SectionTitle>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px', color: '#0f3d75', fontSize: '0.92rem' }}>i. Technical Dissemination & Professional Development</h4>
          {canEdit ? (
            <>
              <textarea value={technicalText} onChange={(e) => setTechnicalText(e.target.value)} rows={3} style={inputStyle} placeholder="Describe technical dissemination activities..." />
              <ImageUploadBox label="Photos" images={report?.technical_images || []} canEdit={canEdit} onUpload={(file) => uploadSectionImage('technical', file)} onDelete={(id) => deleteImage(id, 'technical')} />
              <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff' }} onClick={() => saveSection({ technical_dissemination: technicalText })}>Save</button>
            </>
          ) : (
            <>
              <ReadonlyText value={report?.technical_dissemination} placeholder="No content available." />
              <ImageUploadBox label="Photos" images={report?.technical_images || []} canEdit={false} onUpload={() => {}} onDelete={() => {}} />
            </>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px', color: '#0f3d75', fontSize: '0.92rem' }}>ii. Community Engagement</h4>
          {canEdit ? (
            <>
              <textarea value={communityText} onChange={(e) => setCommunityText(e.target.value)} rows={3} style={inputStyle} placeholder="Describe community engagement activities..." />
              <ImageUploadBox label="Photos" images={report?.community_images || []} canEdit={canEdit} onUpload={(file) => uploadSectionImage('community', file)} onDelete={(id) => deleteImage(id, 'community')} />
              <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff' }} onClick={() => saveSection({ community_engagement: communityText })}>Save</button>
            </>
          ) : (
            <>
              <ReadonlyText value={report?.community_engagement} placeholder="No content available." />
              <ImageUploadBox label="Photos" images={report?.community_images || []} canEdit={false} onUpload={() => {}} onDelete={() => {}} />
            </>
          )}
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px', color: '#0f3d75', fontSize: '0.92rem' }}>iii. Member Recognition & Appreciation</h4>
          {canEdit ? (
            <>
              <textarea value={recognitionText} onChange={(e) => setRecognitionText(e.target.value)} rows={3} style={inputStyle} placeholder="Describe member recognition activities..." />
              <ImageUploadBox label="Photos" images={report?.recognition_images || []} canEdit={canEdit} onUpload={(file) => uploadSectionImage('recognition', file)} onDelete={(id) => deleteImage(id, 'recognition')} />
              <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff' }} onClick={() => saveSection({ member_recognition: recognitionText })}>Save</button>
            </>
          ) : (
            <>
              <ReadonlyText value={report?.member_recognition} placeholder="No content available." />
              <ImageUploadBox label="Photos" images={report?.recognition_images || []} canEdit={false} onUpload={() => {}} onDelete={() => {}} />
            </>
          )}
        </div>
      </div>

      <div style={sectionCardStyle}>
        <SectionTitle icon={FiAlertCircle}>5. Challenges</SectionTitle>
        {canEdit ? (
          <>
            <textarea value={challengesText} onChange={(e) => setChallengesText(e.target.value)} rows={4} style={inputStyle} placeholder="Describe the challenges faced during the year..." />
            <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff', marginTop: 10 }} onClick={() => saveSection({ challenges: challengesText })}>Save</button>
          </>
        ) : (
          <ReadonlyText value={report?.challenges} placeholder="No challenges recorded." />
        )}
      </div>

      <div style={sectionCardStyle}>
        <SectionTitle icon={FiStar}>6. Recommendations</SectionTitle>
        {canEdit ? (
          <>
            <textarea value={recommendationsText} onChange={(e) => setRecommendationsText(e.target.value)} rows={4} style={inputStyle} placeholder="List the recommendations for the next year..." />
            <button type="button" style={{ ...toolbarButtonStyle, background: '#0f62c9', color: '#fff', marginTop: 10 }} onClick={() => saveSection({ recommendations: recommendationsText })}>Save</button>
          </>
        ) : (
          <ReadonlyText value={report?.recommendations} placeholder="No recommendations recorded." />
        )}
      </div>
    </>
  );
};

export default AnnualReportPage;
