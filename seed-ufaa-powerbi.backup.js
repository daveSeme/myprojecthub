require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production.local"
      : ".env.local",
});

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("ERROR: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");
  process.exit(1);
}

initializeApp({ projectId });

const db = getFirestore();

const phases = [
  {
    name: "Project Initiation & Requirements",
    tasks: [
      "Project kickoff and stakeholder engagement",
      "Business requirements gathering",
      "Current reporting assessment",
      "Power BI requirements specification",
      "Data source inventory",
      "Project governance and implementation plan",
      "Requirements sign-off",
    ],
  },
  {
    name: "BC24 Integration & Data Architecture",
    tasks: [
      "Business Central 24 environment assessment",
      "BC24 company and data source mapping",
      "API and integration configuration",
      "Data extraction architecture",
      "Data warehouse / lake architecture",
      "ETL and data transformation design",
      "Data model design",
      "Master data mapping",
      "Data quality and validation framework",
      "Integration testing",
    ],
  },
  {
    name: "Financial Reporting",
    tasks: [
      "General ledger reporting",
      "Income statement reporting",
      "Balance sheet reporting",
      "Cash flow reporting",
      "Accounts payable reporting",
      "Accounts receivable reporting",
      "Trial balance reporting",
      "Financial performance analysis",
      "Financial dashboard development",
    ],
  },
  {
    name: "Budget & Utilization Reporting",
    tasks: [
      "Budget structure mapping",
      "Budget vs actual reporting",
      "Budget utilization analysis",
      "Departmental budget reporting",
      "Program and activity budget reporting",
      "Variance analysis",
      "Budget dashboard development",
    ],
  },
  {
    name: "Management & Operational Reporting",
    tasks: [
      "Management reporting requirements",
      "Operational KPI definition",
      "Departmental performance reporting",
      "Workflow and process reporting",
      "Operational trend analysis",
      "Exception reporting",
      "Management dashboard development",
      "Executive management reports",
    ],
  },
  {
    name: "Consolidated Reporting",
    tasks: [
      "Multi-company consolidation requirements",
      "Company reporting structure",
      "Inter-company reporting",
      "Consolidated financial statements",
      "Group performance reporting",
      "Consolidated dashboard development",
    ],
  },
  {
    name: "Dashboard & Analytics",
    tasks: [
      "Power BI dashboard architecture",
      "Executive dashboard",
      "Financial dashboard",
      "Budget dashboard",
      "Operational dashboard",
      "Management dashboard",
      "KPI and metrics implementation",
      "Interactive analytics and drill-through",
      "Dashboard performance optimization",
    ],
  },
  {
    name: "Security & User Management",
    tasks: [
      "Microsoft Entra ID integration",
      "Power BI workspace configuration",
      "Security roles definition",
      "Row-level security design",
      "User access configuration",
      "Departmental access controls",
      "Executive access configuration",
      "Security testing",
      "Access governance documentation",
    ],
  },
  {
    name: "Testing & Deployment",
    tasks: [
      "Unit testing",
      "Data validation testing",
      "Integration testing",
      "User acceptance testing",
      "Performance testing",
      "Security testing",
      "Defect resolution",
      "Production deployment",
      "Post-deployment validation",
      "Production handover",
    ],
  },
  {
    name: "Training & Knowledge Transfer",
    tasks: [
      "Administrator training",
      "Power BI developer training",
      "Management user training",
      "End-user training",
      "Training materials preparation",
      "User manuals and documentation",
      "Knowledge transfer and handover",
    ],
  },
  {
    name: "Licensing, Support & Maintenance",
    tasks: [
      "Power BI licensing assessment",
      "License allocation",
      "Workspace administration",
      "System monitoring",
      "Report maintenance",
      "Data refresh monitoring",
      "Technical support",
      "Issue management",
      "Maintenance documentation",
    ],
  },
  {
    name: "SLA & Continuous Support",
    tasks: [
      "SLA definition",
      "Support procedures",
      "Incident management process",
      "Service monitoring",
      "Performance monitoring",
      "Continuous improvement",
      "SLA reporting and review",
    ],
  },
];

async function seed() {
  console.log("");
  console.log("========================================");
  console.log("UFAA POWER BI FIREBASE SEED");
  console.log("========================================");
  console.log(`Firebase Project: ${projectId}`);
  console.log("========================================");
  console.log("");

  console.log("Creating UFAA Power BI project...");

  const projectRef = await db.collection("projects").add({
    name: "UFAA Microsoft Power BI Enterprise Reporting & Analytics",
    client: "Unclaimed Financial Assets Authority (UFAA)",
    description:
      "Supply and implementation of Microsoft Power BI Enterprise Reporting and Analytics integrating BC24 multi-company data for financial, budgeting, management, operational, consolidated and executive reporting.",
    status: "In Progress",
    priority: "High",
    technology:
      "Microsoft Power BI, Business Central 24, Microsoft Entra ID",
    category: "Business Intelligence & Analytics",
    progress: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Project created: ${projectRef.id}`);

  let taskCount = 0;

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];

    console.log(
      `Creating Phase ${phaseIndex + 1}/${phases.length}: ${phase.name}`
    );

    for (let taskIndex = 0; taskIndex < phase.tasks.length; taskIndex++) {
      const title = phase.tasks[taskIndex];

      await db.collection("tasks").add({
        projectId: projectRef.id,
        phase: phase.name,
        phaseOrder: phaseIndex + 1,
        taskOrder: taskIndex + 1,
        title,
        name: title,
        description: title,
        status: "Not Started",
        progress: 0,
        priority: "High",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      taskCount++;
    }
  }

  console.log("");
  console.log("========================================");
  console.log("SEED COMPLETED SUCCESSFULLY");
  console.log("========================================");
  console.log(`Firebase Project: ${projectId}`);
  console.log(`Project ID: ${projectRef.id}`);
  console.log(`Phases: ${phases.length}`);
  console.log(`Tasks: ${taskCount}`);
  console.log("========================================");
}

seed().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error("SEED FAILED");
  console.error("========================================");
  console.error(error);
  console.error("========================================");
  process.exit(1);
});
