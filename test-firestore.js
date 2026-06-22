const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const envVars = fs.readFileSync(".env.local", "utf8").split(/\r?\n/);
const env = {};
let currentKey = null;
let currentValue = "";

envVars.forEach(line => {
  if (line.trim().startsWith("#") || line.trim() === "") return;
  
  if (currentKey) {
    if (line.endsWith('"')) {
      currentValue += "\\n" + line.slice(0, -1);
      env[currentKey] = currentValue.replace(/\\n/g, '\n');
      currentKey = null;
      currentValue = "";
    } else {
      currentValue += "\\n" + line;
    }
  } else {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1];
      let val = match[2];
      if (val.startsWith('"') && !val.endsWith('"')) {
        currentKey = key;
        currentValue = val.slice(1);
      } else if (val.startsWith('"') && val.endsWith('"')) {
        env[key] = val.slice(1, -1).replace(/\\n/g, '\n');
      } else {
        env[key] = val;
      }
    }
  }
});

const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY;

try {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  console.log("App Initialized.");
  
  const db = getFirestore();
  db.collection("users").doc("test").get()
    .then(() => console.log("Firestore accessible!"))
    .catch(err => console.error("Firestore error:", err));

} catch (error) {
  console.error("Initialization failed:", error);
}
