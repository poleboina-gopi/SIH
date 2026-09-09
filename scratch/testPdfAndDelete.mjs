// scratch/testPdfAndDelete.mjs
import fs from 'fs';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== TEST 1: Authenticate Inspector & Admin ===');
  const inspectorRes = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'inspector@gov.in', password: 'Inspector@2026!' })
  });
  const inspectorData = await inspectorRes.json();
  if (!inspectorRes.ok || !inspectorData.token) {
    throw new Error('Inspector login failed: ' + JSON.stringify(inspectorData));
  }
  const inspectorToken = inspectorData.token;
  console.log('✅ Inspector logged in successfully:', inspectorData.user.name, `(${inspectorData.user.role})`);

  const adminRes = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gov.in', password: 'Admin@2026!' })
  });
  const adminData = await adminRes.json();
  if (!adminRes.ok || !adminData.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminData));
  }
  const adminToken = adminData.token;
  console.log('✅ Admin logged in successfully:', adminData.user.name, `(${adminData.user.role})`);

  console.log('\n=== TEST 2: PDF Report Generation ===');
  // Get an existing report or create one
  const reportsRes = await fetch(`${API_BASE}/reports`, {
    headers: { Authorization: `Bearer ${inspectorToken}` }
  });
  const reportsData = await reportsRes.json();
  let testReportId = reportsData.reports?.[0]?.id;

  if (!testReportId) {
    console.log('No existing reports, creating a test inspection...');
    const valRes = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`
      },
      body: JSON.stringify({
        product_name: 'Amul Butter 500g',
        brand: 'Amul',
        category: 'Dairy',
        raw_text: 'Pasteurised Butter Net Qty: 500g MRP: Rs 275 Mfd: 08/2026 Consumer Care: 1800-258-3333',
        parsed_fields: {
          commodity_name: 'Pasteurised Butter',
          net_quantity: { raw: '500g', is_standard: true },
          mrp: { raw: 'Rs 275', includes_taxes: true },
          mfg_date: { date: '08/2026', is_compliant: true },
          consumer_care: { phone: '1800-258-3333', email: 'customercare@amul.coop' }
        }
      })
    });
    const valData = await valRes.json();
    testReportId = valData.report_id;
  }

  console.log(`Downloading PDF for Report ID: ${testReportId}...`);
  const pdfRes = await fetch(`${API_BASE}/report/${testReportId}/pdf`, {
    headers: { Authorization: `Bearer ${inspectorToken}` }
  });

  console.log('HTTP Status:', pdfRes.status);
  console.log('Content-Type:', pdfRes.headers.get('content-type'));
  console.log('Content-Disposition:', pdfRes.headers.get('content-disposition'));

  if (!pdfRes.ok) {
    const errText = await pdfRes.text();
    throw new Error(`PDF generation failed (${pdfRes.status}): ${errText}`);
  }

  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  console.log(`Received PDF buffer size: ${pdfBuffer.length} bytes`);
  const header = pdfBuffer.subarray(0, 8).toString('utf-8');
  console.log('PDF Header magic bytes:', header);
  if (!header.startsWith('%PDF')) {
    throw new Error('Invalid PDF format, magic bytes not %PDF: ' + header);
  }
  console.log('✅ PDF Generation PASSED! Valid %PDF document received.');

  console.log('\n=== TEST 3: Delete Inspection & RBAC Security ===');
  // 3a. Create an inspection by Inspector
  console.log('Creating inspection to test deletion...');
  const createRes = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${inspectorToken}`
    },
    body: JSON.stringify({
      product_name: 'Sample Detergent Powder 1kg',
      brand: 'Surf',
      category: 'FMCG',
      raw_text: 'Detergent Powder Net Wt: 1000g MRP: Rs 150',
      parsed_fields: {
        commodity_name: 'Detergent Powder',
        net_quantity: { raw: '1000g', is_standard: true },
        mrp: { raw: 'Rs 150', includes_taxes: true }
      }
    })
  });
  const createData = await createRes.json();
  const scanId = createData.scan?.id || createData.scan?._id;
  const reportId = createData.report_id;
  console.log(`Created scan ${scanId} with report ${reportId}`);

  // 3b. Unauthorized (No Token) -> 401
  console.log('Testing deletion without token...');
  const noTokenRes = await fetch(`${API_BASE}/scan/${scanId}`, { method: 'DELETE' });
  console.log('No token response status:', noTokenRes.status);
  if (noTokenRes.status !== 401) {
    throw new Error(`Expected 401, got ${noTokenRes.status}`);
  }
  console.log('✅ 401 Unauthorized enforced for unauthenticated deletion');

  // 3b-2. Unauthorized Inspector (Inspector B trying to delete Inspector A's scan) -> 403
  console.log('Testing deletion by another unauthorized inspector...');
  // Create Inspector B
  const inspectorBEmail = `inspector_b_${Date.now()}@gov.in`;
  const regBRes = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Inspector',
      lastName: 'Two',
      email: inspectorBEmail,
      phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: 'InspectorB@2026!',
      role: 'inspector'
    })
  });
  const regBData = await regBRes.json();
  const inspectorBToken = regBData.token;

  const forbiddenRes = await fetch(`${API_BASE}/scan/${scanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${inspectorBToken}` }
  });
  console.log('Cross-inspector delete status:', forbiddenRes.status);
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-inspector deletion, got ${forbiddenRes.status}`);
  }
  console.log('✅ 403 Forbidden strictly enforced: Inspectors cannot delete other inspectors\' scans');

  // 3c. Delete as Creator Inspector -> 200
  console.log('Testing deletion by creator inspector...');
  const deleteInspectorRes = await fetch(`${API_BASE}/scan/${scanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${inspectorToken}` }
  });
  const deleteInspectorData = await deleteInspectorRes.json();
  console.log('Inspector delete response:', deleteInspectorRes.status, deleteInspectorData);
  if (deleteInspectorRes.status !== 200 || !deleteInspectorData.success) {
    throw new Error(`Inspector deletion failed: ${JSON.stringify(deleteInspectorData)}`);
  }
  console.log('✅ Inspection deleted successfully by creator inspector');

  // 3d. Verify database cleanup
  const checkReportRes = await fetch(`${API_BASE}/report/${reportId}`, {
    headers: { Authorization: `Bearer ${inspectorToken}` }
  });
  console.log('Checking if report is gone, status:', checkReportRes.status);
  if (checkReportRes.status !== 404) {
    throw new Error(`Expected 404 for deleted report, got ${checkReportRes.status}`);
  }
  console.log('✅ Database cleanup verified: Report not found after deletion');

  // 3e. Test Admin deletion of another inspection
  console.log('\nTesting Admin deletion capability...');
  const create2Res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${inspectorToken}`
    },
    body: JSON.stringify({
      product_name: 'Admin Delete Test Item',
      brand: 'TestBrand',
      category: 'Grocery',
      raw_text: 'Test Item MRP: Rs 50'
    })
  });
  const create2Data = await create2Res.json();
  const scan2Id = create2Data.scan?.id || create2Data.scan?._id;
  console.log(`Created second scan: ${scan2Id}`);

  const deleteAdminRes = await fetch(`${API_BASE}/scan/${scan2Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const deleteAdminData = await deleteAdminRes.json();
  console.log('Admin delete status:', deleteAdminRes.status, deleteAdminData);
  if (deleteAdminRes.status !== 200 || !deleteAdminData.success) {
    throw new Error(`Admin deletion failed: ${JSON.stringify(deleteAdminData)}`);
  }
  console.log('✅ Inspection deleted successfully by ADMIN');

  console.log('\n========================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
