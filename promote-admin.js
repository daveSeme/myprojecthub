const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
  projectId: 'dave-project-hub',
});

const db = getFirestore();

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node promote-admin.js YOUR_UID');
  process.exit(1);
}

async function promote() {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    console.error(`❌ User profile does not exist: ${uid}`);
    process.exit(1);
  }

  await ref.update({
    role: 'admin',
  });

  console.log(`✅ ${uid} has been promoted to admin.`);
}

promote().catch((error) => {
  console.error('❌ Failed:', error.message);
  process.exit(1);
});
