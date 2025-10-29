/**
 * Intelligent Code Review Assistant (v5.0)
 *
 * AI-powered code review and quality analysis platform:
 * - Automated code review with AI analysis
 * - Bug detection and security vulnerability scanning
 * - Code quality metrics (maintainability, complexity, duplication)
 * - Performance optimization suggestions
 * - Best practices and style guide enforcement
 * - Test coverage analysis
 * - Documentation completeness checking
 * - Dependency security auditing
 * - Pull request review automation
 * - Multi-language support (JavaScript, TypeScript, Python, Java, Go, etc.)
 * - Integration with Git/GitHub/GitLab
 *
 * Replaces: SonarQube, CodeClimate, Snyk, GitHub Copilot ($100-$700/month)
 */

export interface CodeReview {
  id: string;
  repositoryId: string;
  type: 'commit' | 'pull-request' | 'branch' | 'file';
  targetId: string; // commit SHA, PR number, branch name, or file path
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  language: ProgrammingLanguage;
  summary: ReviewSummary;
  issues: Issue[];
  metrics: CodeMetrics;
  suggestions: Suggestion[];
  score: number; // 0-100 overall quality score
  createdAt: string;
  completedAt?: string;
  reviewedBy: 'ai' | 'human' | 'hybrid';
}

export type ProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'swift'
  | 'kotlin'
  | 'other';

export interface ReviewSummary {
  linesAnalyzed: number;
  filesAnalyzed: number;
  issuesFound: number;
  criticalIssues: number;
  warnings: number;
  suggestions: number;
  codeSmells: number;
  securityVulnerabilities: number;
  performanceIssues: number;
  testCoverage: number; // percentage
  documentation: number; // percentage
}

export interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: IssueCategory;
  title: string;
  description: string;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  codeSnippet: string;
  suggestion: string;
  references?: string[]; // URLs to documentation
  effort: 'trivial' | 'easy' | 'medium' | 'hard';
  tags: string[];
  ruleId?: string;
  cwe?: string;
  cve?: string;
}

export type IssueCategory =
  | 'bug'
  | 'security'
  | 'performance'
  | 'code-smell'
  | 'style'
  | 'best-practice'
  | 'maintainability'
  | 'testing'
  | 'documentation'
  | 'accessibility'
  | 'compatibility'
  | 'dependency';

export interface CodeMetrics {
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  duplication: DuplicationMetrics;
  coverage: CoverageMetrics;
  dependencies: DependencyMetrics;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  commentLines: number;
  commentRatio: number;
  averageMethodLength: number;
  maxMethodLength: number;
  totalFunctions: number;
  totalClasses: number;
}

export interface MaintainabilityMetrics {
  maintainabilityIndex: number; // 0-100
  technicalDebt: string; // e.g., "2 days"
  codeSmells: number;
  duplicatedLines: number;
  duplicatedBlocks: number;
}

export interface DuplicationMetrics {
  duplicatedLines: number;
  duplicatedBlocks: number;
  duplicatedFiles: number;
  duplicationPercentage: number;
  duplications: Duplication[];
}

export interface Duplication {
  id: string;
  lines: number;
  tokens: number;
  files: DuplicatedFile[];
}

export interface DuplicatedFile {
  path: string;
  startLine: number;
  endLine: number;
  code: string;
}

export interface CoverageMetrics {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
  uncoveredLines: number[];
  totalLines: number;
  coveredLines: number;
}

export interface DependencyMetrics {
  totalDependencies: number;
  directDependencies: number;
  transitiveDependencies: number;
  outdatedDependencies: number;
  vulnerableDependencies: number;
  licenseIssues: number;
}

export interface Suggestion {
  id: string;
  type: 'refactor' | 'optimize' | 'simplify' | 'modernize' | 'security' | 'test';
  title: string;
  description: string;
  filePath: string;
  lineNumber: number;
  originalCode: string;
  suggestedCode: string;
  benefit: string;
  effort: 'trivial' | 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  autoFixable: boolean;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
  defaultBranch: string;
  languages: ProgrammingLanguage[];
  reviewConfig: ReviewConfig;
  lastReviewed?: string;
  createdAt: string;
}

export interface ReviewConfig {
  autoReview: boolean;
  reviewOnPush: boolean;
  reviewOnPR: boolean;
  severityThreshold: Issue['severity'];
  enabledCategories: IssueCategory[];
  customRules: CustomRule[];
  excludePaths: string[];
  styleGuide?: string;
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  pattern: string; // regex or AST pattern
  severity: Issue['severity'];
  message: string;
  category: IssueCategory;
  autoFix?: string;
}

export interface PullRequestReview {
  id: string;
  reviewId: string;
  prNumber: number;
  repositoryId: string;
  title: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  comments: ReviewComment[];
  approval: 'approved' | 'changes-requested' | 'commented' | 'pending';
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  filePath: string;
  lineNumber: number;
  body: string;
  severity: Issue['severity'];
  category: IssueCategory;
  suggestion?: string;
  resolved: boolean;
  createdAt: string;
}

export interface SecurityScan {
  id: string;
  repositoryId: string;
  type: 'code' | 'dependencies' | 'secrets' | 'all';
  status: 'scanning' | 'completed' | 'failed';
  vulnerabilities: Vulnerability[];
  secrets: SecretLeak[];
  riskScore: number; // 0-100
  scannedAt: string;
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cwe: string;
  cve?: string;
  cvss?: number;
  affected: string; // dependency name or file path
  fixedIn?: string; // version
  references: string[];
  patchAvailable: boolean;
}

export interface SecretLeak {
  id: string;
  type: 'api-key' | 'password' | 'token' | 'private-key' | 'certificate' | 'credentials';
  filePath: string;
  lineNumber: number;
  secret: string; // masked
  confidence: number;
  recommendation: string;
}

export interface CodeComparisonResult {
  filesChanged: number;
  additions: number;
  deletions: number;
  changes: FileChange[];
  quality: {
    before: number;
    after: number;
    improvement: number;
  };
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  diff: string;
  issues: Issue[];
}

class CodeReviewService {
  private reviews: Map<string, CodeReview> = new Map();
  private repositories: Map<string, Repository> = new Map();
  private prReviews: Map<string, PullRequestReview> = new Map();
  private securityScans: Map<string, SecurityScan> = new Map();

  // ==================== Repository Management ====================

  registerRepository(data: Omit<Repository, 'id' | 'lastReviewed' | 'createdAt'>): Repository {
    const repository: Repository = {
      id: `repo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    this.repositories.set(repository.id, repository);
    return repository;
  }

  getRepository(id: string): Repository | undefined {
    return this.repositories.get(id);
  }

  getAllRepositories(): Repository[] {
    return Array.from(this.repositories.values());
  }

  updateRepositoryConfig(repoId: string, config: Partial<ReviewConfig>): Repository {
    const repository = this.repositories.get(repoId);
    if (!repository) throw new Error('Repository not found');

    repository.reviewConfig = {
      ...repository.reviewConfig,
      ...config,
    };

    this.repositories.set(repoId, repository);
    return repository;
  }

  // ==================== Code Review ====================

  async reviewCode(data: {
    repositoryId: string;
    type: CodeReview['type'];
    targetId: string;
    files?: string[];
  }): Promise<CodeReview> {
    const repository = this.repositories.get(data.repositoryId);
    if (!repository) throw new Error('Repository not found');

    const review: CodeReview = {
      id: `review-${Date.now()}`,
      repositoryId: data.repositoryId,
      type: data.type,
      targetId: data.targetId,
      status: 'analyzing',
      language: repository.languages[0],
      summary: {
        linesAnalyzed: 0,
        filesAnalyzed: 0,
        issuesFound: 0,
        criticalIssues: 0,
        warnings: 0,
        suggestions: 0,
        codeSmells: 0,
        securityVulnerabilities: 0,
        performanceIssues: 0,
        testCoverage: 0,
        documentation: 0,
      },
      issues: [],
      metrics: this.initializeMetrics(),
      suggestions: [],
      score: 0,
      createdAt: new Date().toISOString(),
      reviewedBy: 'ai',
    };

    this.reviews.set(review.id, review);

    // Simulate code analysis
    await this.performCodeAnalysis(review, repository);

    return review;
  }

  private initializeMetrics(): CodeMetrics {
    return {
      complexity: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        linesOfCode: 0,
        commentLines: 0,
        commentRatio: 0,
        averageMethodLength: 0,
        maxMethodLength: 0,
        totalFunctions: 0,
        totalClasses: 0,
      },
      maintainability: {
        maintainabilityIndex: 0,
        technicalDebt: '0 hours',
        codeSmells: 0,
        duplicatedLines: 0,
        duplicatedBlocks: 0,
      },
      duplication: {
        duplicatedLines: 0,
        duplicatedBlocks: 0,
        duplicatedFiles: 0,
        duplicationPercentage: 0,
        duplications: [],
      },
      coverage: {
        lineCoverage: 0,
        branchCoverage: 0,
        functionCoverage: 0,
        statementCoverage: 0,
        uncoveredLines: [],
        totalLines: 0,
        coveredLines: 0,
      },
      dependencies: {
        totalDependencies: 0,
        directDependencies: 0,
        transitiveDependencies: 0,
        outdatedDependencies: 0,
        vulnerableDependencies: 0,
        licenseIssues: 0,
      },
    };
  }

  private async performCodeAnalysis(review: CodeReview, repository: Repository): Promise<void> {
    await this.delay(2000);

    // Simulate realistic code analysis results
    const filesCount = Math.floor(Math.random() * 20) + 5;
    const linesCount = filesCount * (Math.floor(Math.random() * 200) + 100);

    review.summary.filesAnalyzed = filesCount;
    review.summary.linesAnalyzed = linesCount;

    // Generate metrics
    review.metrics = {
      complexity: {
        cyclomaticComplexity: Math.floor(Math.random() * 50) + 10,
        cognitiveComplexity: Math.floor(Math.random() * 40) + 5,
        linesOfCode: linesCount,
        commentLines: Math.floor(linesCount * (0.1 + Math.random() * 0.2)),
        commentRatio: 0.15 + Math.random() * 0.15,
        averageMethodLength: Math.floor(Math.random() * 30) + 10,
        maxMethodLength: Math.floor(Math.random() * 100) + 50,
        totalFunctions: Math.floor(filesCount * 5),
        totalClasses: Math.floor(filesCount * 2),
      },
      maintainability: {
        maintainabilityIndex: 60 + Math.random() * 30,
        technicalDebt: `${Math.floor(Math.random() * 10) + 1} days`,
        codeSmells: Math.floor(Math.random() * 15) + 3,
        duplicatedLines: Math.floor(linesCount * 0.05),
        duplicatedBlocks: Math.floor(Math.random() * 5),
      },
      duplication: {
        duplicatedLines: Math.floor(linesCount * 0.05),
        duplicatedBlocks: Math.floor(Math.random() * 5),
        duplicatedFiles: Math.floor(filesCount * 0.3),
        duplicationPercentage: 3 + Math.random() * 7,
        duplications: [],
      },
      coverage: {
        lineCoverage: 60 + Math.random() * 30,
        branchCoverage: 50 + Math.random() * 30,
        functionCoverage: 65 + Math.random() * 25,
        statementCoverage: 62 + Math.random() * 28,
        uncoveredLines: [],
        totalLines: linesCount,
        coveredLines: Math.floor(linesCount * (0.6 + Math.random() * 0.3)),
      },
      dependencies: {
        totalDependencies: 50 + Math.floor(Math.random() * 100),
        directDependencies: 20 + Math.floor(Math.random() * 30),
        transitiveDependencies: 30 + Math.floor(Math.random() * 70),
        outdatedDependencies: Math.floor(Math.random() * 10),
        vulnerableDependencies: Math.floor(Math.random() * 3),
        licenseIssues: Math.floor(Math.random() * 2),
      },
    };

    // Generate issues
    review.issues = this.generateIssues(filesCount, review.language);
    review.summary.issuesFound = review.issues.length;
    review.summary.criticalIssues = review.issues.filter(i => i.severity === 'critical').length;
    review.summary.warnings = review.issues.filter(i => i.severity === 'high' || i.severity === 'medium').length;
    review.summary.codeSmells = review.issues.filter(i => i.category === 'code-smell').length;
    review.summary.securityVulnerabilities = review.issues.filter(i => i.category === 'security').length;
    review.summary.performanceIssues = review.issues.filter(i => i.category === 'performance').length;

    // Generate suggestions
    review.suggestions = this.generateSuggestions(filesCount);
    review.summary.suggestions = review.suggestions.length;

    // Calculate coverage and documentation
    review.summary.testCoverage = review.metrics.coverage.lineCoverage;
    review.summary.documentation = 60 + Math.random() * 30;

    // Calculate overall score
    review.score = this.calculateQualityScore(review);

    // Update status
    review.status = 'completed';
    review.completedAt = new Date().toISOString();

    // Update repository
    repository.lastReviewed = new Date().toISOString();
    this.repositories.set(repository.id, repository);

    this.reviews.set(review.id, review);
  }

  private generateIssues(filesCount: number, language: ProgrammingLanguage): Issue[] {
    const issues: Issue[] = [];
    const issueCount = Math.floor(filesCount * (2 + Math.random() * 3));

    const sampleIssues = this.getSampleIssues(language);

    for (let i = 0; i < issueCount; i++) {
      const sample = sampleIssues[Math.floor(Math.random() * sampleIssues.length)];
      issues.push({
        ...sample,
        id: `issue-${Date.now()}-${i}`,
        filePath: `src/${Math.floor(Math.random() * filesCount)}/file.${this.getFileExtension(language)}`,
        lineNumber: Math.floor(Math.random() * 500) + 1,
        columnNumber: Math.floor(Math.random() * 80) + 1,
      });
    }

    return issues;
  }

  private getSampleIssues(language: ProgrammingLanguage): Omit<Issue, 'id' | 'filePath' | 'lineNumber' | 'columnNumber'>[] {
    return [
      {
        severity: 'critical',
        category: 'security',
        title: 'SQL Injection Vulnerability',
        description: 'Direct string concatenation in SQL query can lead to SQL injection attacks.',
        codeSnippet: 'query = "SELECT * FROM users WHERE id = " + userId',
        suggestion: 'Use parameterized queries or prepared statements: query = "SELECT * FROM users WHERE id = ?"',
        references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
        effort: 'easy',
        tags: ['security', 'sql', 'injection'],
        ruleId: 'security/sql-injection',
        cwe: 'CWE-89',
      },
      {
        severity: 'high',
        category: 'bug',
        title: 'Potential Null Pointer Exception',
        description: 'Variable may be null when accessed without proper null check.',
        codeSnippet: 'const name = user.profile.name',
        suggestion: 'Add null/undefined check: const name = user?.profile?.name',
        effort: 'trivial',
        tags: ['bug', 'null-safety'],
        ruleId: 'bug/null-pointer',
      },
      {
        severity: 'high',
        category: 'security',
        title: 'Hardcoded Credentials',
        description: 'Credentials should not be hardcoded in source code.',
        codeSnippet: 'const API_KEY = "sk-1234567890abcdef"',
        suggestion: 'Use environment variables: const API_KEY = process.env.API_KEY',
        references: ['https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password'],
        effort: 'easy',
        tags: ['security', 'credentials'],
        ruleId: 'security/hardcoded-credentials',
        cwe: 'CWE-798',
      },
      {
        severity: 'medium',
        category: 'performance',
        title: 'Inefficient Loop',
        description: 'Multiple array iterations can be combined for better performance.',
        codeSnippet: 'array.filter(x => x > 0).map(x => x * 2)',
        suggestion: 'Combine operations: array.reduce((acc, x) => x > 0 ? [...acc, x * 2] : acc, [])',
        effort: 'medium',
        tags: ['performance', 'optimization'],
        ruleId: 'performance/inefficient-loop',
      },
      {
        severity: 'medium',
        category: 'code-smell',
        title: 'Complex Function',
        description: 'Function has high cognitive complexity and should be refactored.',
        codeSnippet: 'function processData(data) { /* 150 lines of code */ }',
        suggestion: 'Break down into smaller, focused functions with single responsibilities.',
        effort: 'hard',
        tags: ['maintainability', 'refactoring'],
        ruleId: 'complexity/cognitive-complexity',
      },
      {
        severity: 'low',
        category: 'style',
        title: 'Inconsistent Naming',
        description: 'Variable name does not follow naming conventions.',
        codeSnippet: 'const UserName = "John"',
        suggestion: 'Use camelCase for variables: const userName = "John"',
        effort: 'trivial',
        tags: ['style', 'naming'],
        ruleId: 'style/naming-convention',
      },
      {
        severity: 'low',
        category: 'documentation',
        title: 'Missing JSDoc',
        description: 'Public function lacks documentation.',
        codeSnippet: 'export function calculateTotal(items) { }',
        suggestion: 'Add JSDoc comment describing parameters, return value, and purpose.',
        effort: 'easy',
        tags: ['documentation'],
        ruleId: 'documentation/missing-jsdoc',
      },
      {
        severity: 'info',
        category: 'best-practice',
        title: 'Consider Using Async/Await',
        description: 'Promise chain can be simplified using async/await syntax.',
        codeSnippet: 'getData().then(data => processData(data)).catch(err => handleError(err))',
        suggestion: 'try { const data = await getData(); await processData(data); } catch (err) { handleError(err); }',
        effort: 'easy',
        tags: ['async', 'modern'],
        ruleId: 'best-practice/prefer-async-await',
      },
    ];
  }

  private generateSuggestions(filesCount: number): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const suggestionCount = Math.floor(filesCount * (1 + Math.random() * 2));

    const sampleSuggestions = [
      {
        type: 'refactor' as const,
        title: 'Extract Method',
        description: 'This code block should be extracted into a separate method for better reusability.',
        originalCode: 'if (user) {\n  const name = user.name;\n  const email = user.email;\n  sendEmail(email, name);\n}',
        suggestedCode: 'function sendUserEmail(user) {\n  if (!user) return;\n  sendEmail(user.email, user.name);\n}\nsendUserEmail(user);',
        benefit: 'Improves code reusability and readability',
        effort: 'easy' as const,
        impact: 'medium' as const,
        autoFixable: false,
      },
      {
        type: 'optimize' as const,
        title: 'Use Memoization',
        description: 'This expensive computation should be memoized to improve performance.',
        originalCode: 'const result = expensiveCalculation(data)',
        suggestedCode: 'const result = useMemo(() => expensiveCalculation(data), [data])',
        benefit: 'Reduces unnecessary re-computations',
        effort: 'trivial' as const,
        impact: 'high' as const,
        autoFixable: true,
      },
      {
        type: 'simplify' as const,
        title: 'Simplify Conditional',
        description: 'This conditional expression can be simplified.',
        originalCode: 'if (value === true) { return true; } else { return false; }',
        suggestedCode: 'return value === true;',
        benefit: 'Makes code more concise and readable',
        effort: 'trivial' as const,
        impact: 'low' as const,
        autoFixable: true,
      },
      {
        type: 'modernize' as const,
        title: 'Use Optional Chaining',
        description: 'Replace nested property checks with optional chaining.',
        originalCode: 'const city = user && user.address && user.address.city',
        suggestedCode: 'const city = user?.address?.city',
        benefit: 'Modern syntax, less verbose',
        effort: 'trivial' as const,
        impact: 'low' as const,
        autoFixable: true,
      },
      {
        type: 'security' as const,
        title: 'Use Secure Hash Function',
        description: 'MD5 is not cryptographically secure. Use SHA-256 or bcrypt.',
        originalCode: 'const hash = md5(password)',
        suggestedCode: 'const hash = await bcrypt.hash(password, 10)',
        benefit: 'Improves security of password hashing',
        effort: 'easy' as const,
        impact: 'high' as const,
        autoFixable: false,
      },
    ];

    for (let i = 0; i < suggestionCount; i++) {
      const sample = sampleSuggestions[Math.floor(Math.random() * sampleSuggestions.length)];
      suggestions.push({
        ...sample,
        id: `suggestion-${Date.now()}-${i}`,
        filePath: `src/file${i}.ts`,
        lineNumber: Math.floor(Math.random() * 500) + 1,
      });
    }

    return suggestions;
  }

  private calculateQualityScore(review: CodeReview): number {
    // Quality score based on multiple factors
    const weights = {
      criticalIssues: -10,
      highIssues: -5,
      mediumIssues: -2,
      lowIssues: -0.5,
      complexity: 0.3,
      maintainability: 0.3,
      coverage: 0.2,
      documentation: 0.1,
      duplication: -0.1,
    };

    let score = 100;

    // Deduct for issues
    score += review.issues.filter(i => i.severity === 'critical').length * weights.criticalIssues;
    score += review.issues.filter(i => i.severity === 'high').length * weights.highIssues;
    score += review.issues.filter(i => i.severity === 'medium').length * weights.mediumIssues;
    score += review.issues.filter(i => i.severity === 'low').length * weights.lowIssues;

    // Add for good practices
    score -= (review.metrics.complexity.cyclomaticComplexity - 20) * weights.complexity;
    score += (review.metrics.maintainability.maintainabilityIndex - 50) * weights.maintainability;
    score += review.metrics.coverage.lineCoverage * weights.coverage;
    score += review.summary.documentation * weights.documentation;
    score -= review.metrics.duplication.duplicationPercentage * weights.duplication;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private getFileExtension(language: ProgrammingLanguage): string {
    const extensions: Record<ProgrammingLanguage, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      go: 'go',
      rust: 'rs',
      c: 'c',
      cpp: 'cpp',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      other: 'txt',
    };
    return extensions[language] || 'txt';
  }

  getReview(id: string): CodeReview | undefined {
    return this.reviews.get(id);
  }

  getAllReviews(repositoryId?: string): CodeReview[] {
    let reviews = Array.from(this.reviews.values());

    if (repositoryId) {
      reviews = reviews.filter(r => r.repositoryId === repositoryId);
    }

    return reviews.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ==================== Pull Request Review ====================

  async reviewPullRequest(data: {
    repositoryId: string;
    prNumber: number;
    title: string;
    author: string;
    baseBranch: string;
    headBranch: string;
    files: string[];
  }): Promise<PullRequestReview> {
    // First perform code review
    const review = await this.reviewCode({
      repositoryId: data.repositoryId,
      type: 'pull-request',
      targetId: String(data.prNumber),
      files: data.files,
    });

    // Generate PR-specific comments
    const comments = this.generatePRComments(review);

    // Determine approval status
    const criticalCount = review.issues.filter(i => i.severity === 'critical').length;
    const highCount = review.issues.filter(i => i.severity === 'high').length;

    let approval: PullRequestReview['approval'];
    if (criticalCount > 0) {
      approval = 'changes-requested';
    } else if (highCount > 3) {
      approval = 'changes-requested';
    } else if (highCount > 0 || review.issues.length > 5) {
      approval = 'commented';
    } else {
      approval = 'approved';
    }

    const prReview: PullRequestReview = {
      id: `pr-review-${Date.now()}`,
      reviewId: review.id,
      prNumber: data.prNumber,
      repositoryId: data.repositoryId,
      title: data.title,
      author: data.author,
      baseBranch: data.baseBranch,
      headBranch: data.headBranch,
      filesChanged: review.summary.filesAnalyzed,
      additions: Math.floor(review.summary.linesAnalyzed * 0.6),
      deletions: Math.floor(review.summary.linesAnalyzed * 0.4),
      comments,
      approval,
      createdAt: new Date().toISOString(),
    };

    this.prReviews.set(prReview.id, prReview);
    return prReview;
  }

  private generatePRComments(review: CodeReview): ReviewComment[] {
    const comments: ReviewComment[] = [];

    // Generate comments for high-severity issues
    const importantIssues = review.issues
      .filter(i => i.severity === 'critical' || i.severity === 'high')
      .slice(0, 10);

    for (const issue of importantIssues) {
      comments.push({
        id: `comment-${Date.now()}-${comments.length}`,
        filePath: issue.filePath,
        lineNumber: issue.lineNumber,
        body: `**${issue.title}**\n\n${issue.description}\n\n\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n💡 Suggestion: ${issue.suggestion}`,
        severity: issue.severity,
        category: issue.category,
        suggestion: issue.suggestion,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
    }

    return comments;
  }

  getPRReview(id: string): PullRequestReview | undefined {
    return this.prReviews.get(id);
  }

  // ==================== Security Scanning ====================

  async runSecurityScan(data: {
    repositoryId: string;
    type: SecurityScan['type'];
  }): Promise<SecurityScan> {
    const repository = this.repositories.get(data.repositoryId);
    if (!repository) throw new Error('Repository not found');

    const scan: SecurityScan = {
      id: `scan-${Date.now()}`,
      repositoryId: data.repositoryId,
      type: data.type,
      status: 'scanning',
      vulnerabilities: [],
      secrets: [],
      riskScore: 0,
      scannedAt: new Date().toISOString(),
    };

    this.securityScans.set(scan.id, scan);

    await this.performSecurityScan(scan);

    return scan;
  }

  private async performSecurityScan(scan: SecurityScan): Promise<void> {
    await this.delay(2000);

    // Generate vulnerabilities
    if (scan.type === 'dependencies' || scan.type === 'all') {
      scan.vulnerabilities = this.generateVulnerabilities();
    }

    // Generate secret leaks
    if (scan.type === 'secrets' || scan.type === 'all') {
      scan.secrets = this.generateSecretLeaks();
    }

    // Calculate risk score
    scan.riskScore = this.calculateSecurityRiskScore(scan);

    scan.status = 'completed';
    this.securityScans.set(scan.id, scan);
  }

  private generateVulnerabilities(): Vulnerability[] {
    const count = Math.floor(Math.random() * 5);
    const vulnerabilities: Vulnerability[] = [];

    const samples = [
      {
        severity: 'critical' as const,
        title: 'Remote Code Execution in lodash',
        description: 'A prototype pollution vulnerability allows remote code execution.',
        cwe: 'CWE-94',
        cve: 'CVE-2021-23337',
        cvss: 9.8,
        affected: 'lodash@4.17.19',
        fixedIn: 'lodash@4.17.21',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23337'],
        patchAvailable: true,
      },
      {
        severity: 'high' as const,
        title: 'Cross-Site Scripting (XSS) in react-dom',
        description: 'Improper sanitization of user input can lead to XSS attacks.',
        cwe: 'CWE-79',
        cve: 'CVE-2020-15168',
        cvss: 7.5,
        affected: 'react-dom@16.13.0',
        fixedIn: 'react-dom@16.13.1',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2020-15168'],
        patchAvailable: true,
      },
    ];

    for (let i = 0; i < count; i++) {
      const sample = samples[Math.floor(Math.random() * samples.length)];
      vulnerabilities.push({
        ...sample,
        id: `vuln-${Date.now()}-${i}`,
      });
    }

    return vulnerabilities;
  }

  private generateSecretLeaks(): SecretLeak[] {
    const count = Math.floor(Math.random() * 3);
    const leaks: SecretLeak[] = [];

    for (let i = 0; i < count; i++) {
      leaks.push({
        id: `secret-${Date.now()}-${i}`,
        type: i === 0 ? 'api-key' : i === 1 ? 'password' : 'token',
        filePath: `src/config/credentials.ts`,
        lineNumber: Math.floor(Math.random() * 100) + 1,
        secret: '**********************',
        confidence: 0.8 + Math.random() * 0.2,
        recommendation: 'Move this secret to environment variables and remove from source code.',
      });
    }

    return leaks;
  }

  private calculateSecurityRiskScore(scan: SecurityScan): number {
    let score = 0;

    for (const vuln of scan.vulnerabilities) {
      const weights = { critical: 25, high: 15, medium: 8, low: 3 };
      score += weights[vuln.severity];
    }

    score += scan.secrets.length * 10;

    return Math.min(100, score);
  }

  getSecurityScan(id: string): SecurityScan | undefined {
    return this.securityScans.get(id);
  }

  // ==================== Code Comparison ====================

  async compareCode(data: {
    repositoryId: string;
    baseBranch: string;
    compareBranch: string;
  }): Promise<CodeComparisonResult> {
    await this.delay(1500);

    // Simulate code comparison
    const filesChanged = Math.floor(Math.random() * 20) + 5;
    const additions = Math.floor(Math.random() * 500) + 100;
    const deletions = Math.floor(Math.random() * 300) + 50;

    const changes: FileChange[] = [];
    for (let i = 0; i < filesChanged; i++) {
      changes.push({
        path: `src/file${i}.ts`,
        status: i % 4 === 0 ? 'added' : i % 4 === 1 ? 'deleted' : i % 4 === 2 ? 'renamed' : 'modified',
        additions: Math.floor(Math.random() * 50),
        deletions: Math.floor(Math.random() * 30),
        diff: '+ added line\n- removed line\n  unchanged line',
        issues: [],
      });
    }

    return {
      filesChanged,
      additions,
      deletions,
      changes,
      quality: {
        before: 70 + Math.random() * 15,
        after: 75 + Math.random() * 15,
        improvement: 5 + Math.random() * 5,
      },
    };
  }

  // ==================== Auto-fix ====================

  async applyAutoFixes(reviewId: string, issueIds?: string[]): Promise<number> {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error('Review not found');

    await this.delay(1000);

    let fixableIssues = review.suggestions.filter(s => s.autoFixable);

    if (issueIds) {
      fixableIssues = fixableIssues.filter(s => issueIds.includes(s.id));
    }

    // Simulate applying fixes
    return fixableIssues.length;
  }

  // ==================== Helper Methods ====================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Statistics ====================

  getStatistics(repositoryId?: string) {
    let reviews = Array.from(this.reviews.values());

    if (repositoryId) {
      reviews = reviews.filter(r => r.repositoryId === repositoryId);
    }

    const completedReviews = reviews.filter(r => r.status === 'completed');

    return {
      totalReviews: reviews.length,
      completedReviews: completedReviews.length,
      averageScore: completedReviews.length > 0
        ? completedReviews.reduce((sum, r) => sum + r.score, 0) / completedReviews.length
        : 0,
      totalIssues: completedReviews.reduce((sum, r) => sum + r.issues.length, 0),
      criticalIssues: completedReviews.reduce((sum, r) => sum + r.summary.criticalIssues, 0),
      securityIssues: completedReviews.reduce((sum, r) => sum + r.summary.securityVulnerabilities, 0),
      averageCoverage: completedReviews.length > 0
        ? completedReviews.reduce((sum, r) => sum + r.summary.testCoverage, 0) / completedReviews.length
        : 0,
      totalPRReviews: this.prReviews.size,
      totalSecurityScans: this.securityScans.size,
      totalRepositories: this.repositories.size,
    };
  }
}

export const codeReviewService = new CodeReviewService();
export default codeReviewService;
