const assert = require('assert');
const http = require('http');
const app = require('../src/app');

let server;
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Expanded API Integration Tests...');

  server = app.listen(PORT);

  try {
    // Test 1: Default GET /exercises
    console.log('▶ Test 1: GET /exercises (default pagination)');
    const res1 = await makeRequest('/exercises');
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.meta.pagination.total_items, 1324);
    assert.strictEqual(res1.body.meta.pagination.returned_items, 20);

    // Test 2: Filter with parameters
    console.log('▶ Test 2: GET /exercises with single filters');
    const res2 = await makeRequest('/exercises?page=1&limit=20&body_part=waist&equipment=body%20weight&target=abs&q=sit-up');
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.success, true);
    assert(res2.body.data.length > 0);

    // Test 3: Multi-value filtering
    console.log('▶ Test 3: GET /exercises with multi-value filtering (body_part=chest,waist)');
    const res3 = await makeRequest('/exercises?body_part=chest,waist&limit=50');
    assert.strictEqual(res3.status, 200);
    assert.strictEqual(res3.body.data.length, 50);
    assert(res3.body.data.every((ex) => ['chest', 'waist'].includes(ex.body_part)));
    console.log('  ✔ Passed multi-value filter test');

    // Test 4: Sorting (name_asc vs name_desc)
    console.log('▶ Test 4: GET /exercises sorting (sort=name_desc)');
    const res4 = await makeRequest('/exercises?sort=name_desc&limit=5');
    assert.strictEqual(res4.status, 200);
    const names = res4.body.data.map((ex) => ex.name);
    assert.strictEqual(names[0] > names[1], true);
    console.log('  ✔ Passed sorting test');

    // Test 5: Field selection (fields=id,name,image)
    console.log('▶ Test 5: GET /exercises field selection (fields=id,name,image)');
    const res5 = await makeRequest('/exercises?fields=id,name,image&limit=5');
    assert.strictEqual(res5.status, 200);
    const itemKeys = Object.keys(res5.body.data[0]).sort();
    assert.deepStrictEqual(itemKeys, ['id', 'image', 'name']);
    console.log('  ✔ Passed field selection test');

    // Test 6: Single exercise lookup
    console.log('▶ Test 6: GET /exercises/0001 (Zero-padded ID)');
    const res6 = await makeRequest('/exercises/0001');
    assert.strictEqual(res6.status, 200);
    assert.strictEqual(res6.body.data.id, '0001');

    // Test 7: Batch Lookup (POST /exercises/batch)
    console.log('▶ Test 7: POST /exercises/batch (Fetch multiple exercises in 1 request)');
    const res7 = await makeRequest('/exercises/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { ids: ['0001', '0025', '0032'] }
    });
    assert.strictEqual(res7.status, 200);
    assert.strictEqual(res7.body.found_count, 3);
    assert.strictEqual(res7.body.data.length, 3);
    console.log('  ✔ Passed batch lookup test');

    // Test 8: Random exercises (GET /exercises/random)
    console.log('▶ Test 8: GET /exercises/random?count=3&body_part=chest');
    const res8 = await makeRequest('/exercises/random?count=3&body_part=chest');
    assert.strictEqual(res8.status, 200);
    assert.strictEqual(res8.body.count, 3);
    assert(res8.body.data.every((ex) => ex.body_part === 'chest'));
    console.log('  ✔ Passed random exercises selection test');

    // Test 9: Search suggestions (GET /exercises/suggestions)
    console.log('▶ Test 9: GET /exercises/suggestions?q=press&limit=5');
    const res9 = await makeRequest('/exercises/suggestions?q=press&limit=5');
    assert.strictEqual(res9.status, 200);
    assert.strictEqual(res9.body.count, 5);
    console.log('  ✔ Passed autocomplete suggestions test');

    // Test 10: Dataset statistics (GET /exercises/stats)
    console.log('▶ Test 10: GET /exercises/stats');
    const res10 = await makeRequest('/exercises/stats');
    assert.strictEqual(res10.status, 200);
    assert.strictEqual(res10.body.data.total_exercises, 1324);
    assert.strictEqual(res10.body.data.total_categories, 10);
    console.log('  ✔ Passed dataset stats test');

    // Test 11: Static images & videos
    console.log('▶ Test 11: GET /images/0001-2gPfomN.jpg & GET /videos/0001-2gPfomN.gif');
    const resImg = await makeRequest('/images/0001-2gPfomN.jpg');
    const resVid = await makeRequest('/videos/0001-2gPfomN.gif');
    assert.strictEqual(resImg.status, 200);
    assert.strictEqual(resVid.status, 200);
    console.log('  ✔ Passed static assets test');

    console.log('\n🎉 ALL 11 API INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
