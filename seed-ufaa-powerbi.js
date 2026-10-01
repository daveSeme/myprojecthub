const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} = require("firebase/firestore");

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const project = {
  name: "UFAA Microsoft Power BI Enterprise Reporting & Analytics",
  client: "Unclaimed Financial Assets Authority (UFAA)",
  description:
    "Supply and implementation of a Microsoft Power BI Enterprise Reporting and Analytics solution integrating BC24 multi-company data to provide financial, budgeting, management, operational, consolidated and executive reporting.",
  status: "In Progress",
  priority: "High",
  technology: "Microsoft Power BI, Business Central 24, Microsoft Entra ID",
  category: "Business Intelligence & Analytics",
  progress: 0,
};

const phases = [
  {
    name: "Project Initiation & Requirements",
    description: "Project kickoff, requirements gathering, stakeholder identification and reporting requirements.",
    tasks: [
      "Project kickoff",
      "Identify project stakeholders",
      "Gather business and reporting requirements",
      "Identify the three BC24 companies",
      "Document security and access requirements",
      "Define reporting and analytics requirements",
      "Prepare project implementation plan",
    ],
  },

  {
    name: "BC24 Integration & Data Architecture",
    description: "Integrate Business Central 24 data and establish the enterprise reporting data architecture.",
    tasks: [
      "Configure BC24 data connections",
      "Implement BC24 multi-company integration",
      "Configure API/OData data access",
      "Implement automated data extraction",
      "Implement data transformation",
      "Implement data cleansing",
      "Design centralized reporting data model",
      "Validate source data",
      "Configure automated refresh",
      "Test data integration and refresh",
    ],
  },

  {
    name: "Financial Reporting",
    description: "Develop the financial reporting dashboards and reports specified in the SOW.",
    tasks: [
      "Statement of Financial Position",
      "Statement of Financial Performance",
      "Cash Flow Statement",
      "Trial Balance",
      "General Ledger Reporting",
      "Bank Reconciliation Reporting",
      "End-Year Financial Statements",
      "Validate financial reporting calculations",
      "Validate financial reports against BC24",
    ],
  },

  {
    name: "Budget & Utilization Reporting",
    description: "Develop budgeting, utilization and variance reporting.",
    tasks: [
      "Annual Budget Reporting",
      "Budget vs Actual Reporting",
      "Departmental Budget Utilization",
      "Budget Variance Analysis",
      "Commitment and Expenditure Tracking",
      "Validate budget calculations",
      "Validate departmental reporting",
    ],
  },

  {
    name: "Management & Operational Reporting",
    description: "Develop management and operational reporting required by the Authority.",
    tasks: [
      "Monthly Financial Reporting",
      "Quarterly Financial Reporting",
      "Revenue and Expenditure Reporting",
      "Procurement and Payment Reporting",
      "Executive Dashboard",
      "Audit and Compliance Reporting",
      "Management KPI reporting",
      "Operational performance reporting",
    ],
  },

  {
    name: "Consolidated Reporting",
    description: "Implement consolidated reporting across the three companies.",
    tasks: [
      "Three-company consolidation",
      "Intercompany reporting",
      "Consolidated financial reporting",
      "Centralized consolidated dashboards",
      "Validate consolidated figures",
      "Validate intercompany transactions",
    ],
  },

  {
    name: "Dashboard & Analytics",
    description: "Build interactive dashboards, analytics and professional reporting outputs.",
    tasks: [
      "Develop interactive Power BI dashboards",
      "KPI analysis",
      "Trend analysis",
      "Drill-down functionality",
      "Drill-through functionality",
      "Configure dashboard refresh",
      "Create dashboard templates",
      "Develop professional reporting outputs",
      "Validate dashboard usability",
    ],
  },

  {
    name: "Security & User Management",
    description: "Implement reporting security, user access and audit capabilities.",
    tasks: [
      "Define reporting roles",
      "Configure Row-Level Security",
      "Configure Microsoft Entra ID integration",
      "Configure Single Sign-On",
      "Configure Multi-Factor Authentication",
      "Implement audit and activity logging",
      "Configure secure data protection",
      "Test user permissions",
      "Test security controls",
    ],
  },

  {
    name: "Testing & Deployment",
    description: "Complete technical testing, user acceptance testing and production deployment.",
    tasks: [
      "Technical system testing",
      "Data validation testing",
      "Integration testing",
      "Security testing",
      "User Acceptance Testing",
      "Resolve identified defects",
      "UAT sign-off",
      "Production deployment",
      "Production rollout",
      "Post-deployment validation",
    ],
  },

  {
    name: "Training & Knowledge Transfer",
    description: "Train administrators and end users and provide required documentation.",
    tasks: [
      "Administrator training",
      "End-user training",
      "Prepare administrator manual",
      "Prepare end-user guide",
      "Prepare quick reference guides",
      "Conduct knowledge transfer",
      "Collect training feedback",
    ],
  },

  {
    name: "Licensing, Support & Maintenance",
    description: "Provide licensing and technical support for the agreed period.",
    tasks: [
      "Configure licensing for five named users",
      "Provide technical support",
      "Incident management",
      "System monitoring",
      "Power BI updates",
      "Power BI patches",
      "Troubleshooting",
      "Report customization",
      "Maintenance activities",
    ],
  },

  {
    name: "SLA & Continuous Support",
    description: "Manage service levels and ongoing support obligations.",
    tasks: [
      "Define SLA requirements",
      "Establish support procedures",
      "Monitor SLA performance",
      "Track support incidents",
      "Resolve reported issues",
      "Review system performance",
      "Continuous reporting support",
    ],
  },
];

async function seed() {
  console.log("Creating UFAA Power BI project...");

  const projectRef = await addDoc(collection(db, "projects"), {
    ...project,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log(`Project created: ${projectRef.id}`);

  let taskNumber = 0;

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];

    console.log(`\nPhase ${phaseIndex + 1}: ${phase.name}`);

    for (let taskIndex = 0; taskIndex < phase.tasks.length; taskIndex++) {
      const taskName = phase.tasks[taskIndex];

      taskNumber++;

      await addDoc(collection(db, "tasks"), {
        projectId: projectRef.id,
        phase: phase.name,
        phaseOrder: phaseIndex + 1,
        taskOrder: taskIndex + 1,

        title: taskName,
        name: taskName,

        description: phase.description,

        status: "Not Started",
        progress: 0,

        priority: "High",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`  ✓ ${taskNumber}. ${taskName}`);
    }
  }

  console.log("\n========================================");
  console.log("UFAA PROJECT CREATED SUCCESSFULLY");
  console.log("========================================");
  console.log(`Project ID: ${projectRef.id}`);
  console.log(`Phases: ${phases.length}`);
  console.log(`Tasks: ${taskNumber}`);
  console.log("========================================");
}

seed().catch((error) => {
  console.error("\nERROR:");
  console.error(error);
  process.exit(1);
});
