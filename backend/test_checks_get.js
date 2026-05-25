async function run() {
  try {
    console.log('Testing getInventoryChecks API...');
    const res = await fetch('http://localhost:5000/api/inventory/checks');
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
