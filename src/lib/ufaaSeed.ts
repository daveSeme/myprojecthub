export const UFAA_PROJECT_NAME =
  'UFAA Microsoft Power BI Enterprise Reporting & Analytics';

export const UFAA_PROJECT = {
  name: UFAA_PROJECT_NAME,
  client: 'Unclaimed Financial Assets Authority (UFAA)',
  description:
    'Supply and implementation of Microsoft Power BI Enterprise Reporting and Analytics integrating BC24 multi-company data for financial, budgeting, management, operational, consolidated and executive reporting.',
  type: 'Data / BI Project',
  status: 'active' as const,
  priority: 'high' as const,
  technologies: [
    'Microsoft Power BI',
    'Business Central 24',
    'Microsoft Entra ID',
  ],
};

export const UFAA_PHASES = [
  {
    name: 'Project Initiation & Requirements',
    tasks: [
      'Project kickoff and stakeholder engagement',
      'Business requirements gathering',
      'Current reporting assessment',
      'Power BI requirements specification',
      'Data source inventory',
      'Project governance and implementation plan',
      'Requirements sign-off',
    ],
  },
  {
    name: 'BC24 Integration & Data Architecture',
    tasks: [
      'Business Central 24 environment assessment',
      'BC24 company and data source mapping',
      'API and integration configuration',
      'Data extraction architecture',
      'Data warehouse / lake architecture',
      'ETL and data transformation design',
      'Data model design',
      'Master data mapping',
      'Data quality and validation framework',
      'Integration testing',
    ],
  },
  {
    name: 'Financial Reporting',
    tasks: [
      'General ledger reporting',
      'Income statement reporting',
      'Balance sheet reporting',
      'Cash flow reporting',
      'Accounts payable reporting',
      'Accounts receivable reporting',
      'Trial balance reporting',
      'Financial performance analysis',
      'Financial dashboard development',
    ],
  },
  {
    name: 'Budget & Utilization Reporting',
    tasks: [
      'Budget structure mapping',
      'Budget vs actual reporting',
      'Budget utilization analysis',
      'Departmental budget reporting',
      'Program and activity budget reporting',
      'Variance analysis',
      'Budget dashboard development',
    ],
  },
  {
    name: 'Management & Operational Reporting',
    tasks: [
      'Management reporting requirements',
      'Operational KPI definition',
      'Departmental performance reporting',
      'Workflow and process reporting',
      'Operational trend analysis',
      'Exception reporting',
      'Management dashboard development',
      'Executive management reports',
    ],
  },
  {
    name: 'Consolidated Reporting',
    tasks: [
      'Multi-company consolidation requirements',
      'Company reporting structure',
      'Inter-company reporting',
      'Consolidated financial statements',
      'Group performance reporting',
      'Consolidated dashboard development',
    ],
  },
  {
    name: 'Dashboard & Analytics',
    tasks: [
      'Power BI dashboard architecture',
      'Executive dashboard',
      'Financial dashboard',
      'Budget dashboard',
      'Operational dashboard',
      'Management dashboard',
      'KPI and metrics implementation',
      'Interactive analytics and drill-through',
      'Dashboard performance optimization',
    ],
  },
  {
    name: 'Security & User Management',
    tasks: [
      'Microsoft Entra ID integration',
      'Power BI workspace configuration',
      'Security roles definition',
      'Row-level security design',
      'User access configuration',
      'Departmental access controls',
      'Executive access configuration',
      'Security testing',
      'Access governance documentation',
    ],
  },
  {
    name: 'Testing & Deployment',
    tasks: [
      'Unit testing',
      'Data validation testing',
      'Integration testing',
      'User acceptance testing',
      'Performance testing',
      'Security testing',
      'Defect resolution',
      'Production deployment',
      'Post-deployment validation',
      'Production handover',
    ],
  },
  {
    name: 'Training & Knowledge Transfer',
    tasks: [
      'Administrator training',
      'Power BI developer training',
      'Management user training',
      'End-user training',
      'Training materials preparation',
      'User manuals and documentation',
      'Knowledge transfer and handover',
    ],
  },
  {
    name: 'Licensing, Support & Maintenance',
    tasks: [
      'Power BI licensing assessment',
      'License allocation',
      'Workspace administration',
      'System monitoring',
      'Report maintenance',
      'Data refresh monitoring',
      'Technical support',
      'Issue management',
      'Maintenance documentation',
    ],
  },
  {
    name: 'SLA & Continuous Support',
    tasks: [
      'SLA definition',
      'Support procedures',
      'Incident management process',
      'Service monitoring',
      'Performance monitoring',
      'Continuous improvement',
      'SLA reporting and review',
    ],
  },
] as const;

export const UFAA_TASK_COUNT = UFAA_PHASES.reduce(
  (total, phase) => total + phase.tasks.length,
  0,
);
