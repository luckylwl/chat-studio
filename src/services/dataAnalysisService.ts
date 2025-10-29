/**
 * Data Analysis Workbench Service
 *
 * Features:
 * - Data import (CSV, JSON, Excel)
 * - SQL query generation
 * - Statistical analysis
 * - Visualization recommendations
 * - Natural language queries
 */

import { v4 as uuidv4 } from 'uuid';

export interface Dataset {
  id: string;
  name: string;
  rows: any[];
  columns: ColumnInfo[];
  rowCount: number;
  createdAt: Date;
  metadata: {
    source: string;
    fileSize?: number;
    encoding?: string;
  };
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  nullable: boolean;
  unique: boolean;
  statistics?: ColumnStatistics;
}

export interface ColumnStatistics {
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  mode?: any;
  stdDev?: number;
}

export interface QueryRequest {
  datasetId: string;
  naturalLanguageQuery: string;
}

export interface QueryResult {
  sql?: string;
  data: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

export interface VisualizationRecommendation {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'histogram';
  title: string;
  description: string;
  xAxis?: string;
  yAxis?: string;
  config: any;
  priority: number;
}

export interface StatisticalTest {
  name: string;
  description: string;
  pValue: number;
  significant: boolean;
  conclusion: string;
}

class DataAnalysisService {
  private datasets: Map<string, Dataset> = new Map();

  // ========================
  // Data Import
  // ========================

  async importCSV(file: File): Promise<Dataset> {
    const text = await file.text();
    const rows = this.parseCSV(text);

    return this.createDataset(file.name, rows, { source: 'csv', fileSize: file.size });
  }

  async importJSON(file: File): Promise<Dataset> {
    const text = await file.text();
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : [data];

    return this.createDataset(file.name, rows, { source: 'json', fileSize: file.size });
  }

  async importExcel(file: File): Promise<Dataset> {
    // Would use library like xlsx
    throw new Error('Excel import requires xlsx library');
  }

  private parseCSV(text: string): any[] {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = this.inferType(values[index]);
      });

      return row;
    });
  }

  private inferType(value: string): any {
    if (value === '' || value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    if (Date.parse(value)) return new Date(value);
    return value;
  }

  private createDataset(name: string, rows: any[], metadata: any): Dataset {
    const id = uuidv4();
    const columns = this.analyzeColumns(rows);

    const dataset: Dataset = {
      id,
      name,
      rows,
      columns,
      rowCount: rows.length,
      createdAt: new Date(),
      metadata,
    };

    this.datasets.set(id, dataset);
    return dataset;
  }

  private analyzeColumns(rows: any[]): ColumnInfo[] {
    if (rows.length === 0) return [];

    const columnNames = Object.keys(rows[0]);

    return columnNames.map(name => {
      const values = rows.map(row => row[name]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined);

      const type = this.inferColumnType(nonNullValues);
      const unique = new Set(nonNullValues).size;

      const column: ColumnInfo = {
        name,
        type,
        nullable: values.some(v => v === null || v === undefined),
        unique: unique === nonNullValues.length,
      };

      if (type === 'number') {
        column.statistics = this.calculateNumericStatistics(nonNullValues as number[]);
      } else {
        column.statistics = this.calculateCategoricalStatistics(nonNullValues);
      }

      return column;
    });
  }

  private inferColumnType(values: any[]): 'string' | 'number' | 'boolean' | 'date' {
    if (values.every(v => typeof v === 'number')) return 'number';
    if (values.every(v => typeof v === 'boolean')) return 'boolean';
    if (values.every(v => v instanceof Date)) return 'date';
    return 'string';
  }

  // ========================
  // Statistical Analysis
  // ========================

  private calculateNumericStatistics(values: number[]): ColumnStatistics {
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    const median = count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      nullCount: 0,
      uniqueCount: new Set(values).size,
      min: sorted[0],
      max: sorted[count - 1],
      mean,
      median,
      stdDev,
    };
  }

  private calculateCategoricalStatistics(values: any[]): ColumnStatistics {
    const counts = new Map<any, number>();
    values.forEach(v => {
      counts.set(v, (counts.get(v) || 0) + 1);
    });

    const mode = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      count: values.length,
      nullCount: 0,
      uniqueCount: counts.size,
      mode,
    };
  }

  analyzeCorrelation(datasetId: string, column1: string, column2: string): number {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    const values1 = dataset.rows.map(row => Number(row[column1])).filter(v => !isNaN(v));
    const values2 = dataset.rows.map(row => Number(row[column2])).filter(v => !isNaN(v));

    if (values1.length !== values2.length) {
      throw new Error('Columns have different lengths');
    }

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    return numerator / Math.sqrt(sum1Sq * sum2Sq);
  }

  // ========================
  // Natural Language Query
  // ========================

  async queryWithNaturalLanguage(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now();
    const dataset = this.datasets.get(request.datasetId);

    if (!dataset) {
      throw new Error('Dataset not found');
    }

    // Parse natural language query
    const sql = this.parseNaturalLanguageToSQL(request.naturalLanguageQuery, dataset);

    // Execute query
    const data = this.executeQuery(dataset, sql);

    return {
      sql,
      data,
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      rowCount: data.length,
      executionTime: Date.now() - startTime,
    };
  }

  private parseNaturalLanguageToSQL(query: string, dataset: Dataset): string {
    // Simple pattern matching (in production, use LLM)
    const lowerQuery = query.toLowerCase();

    let sql = `SELECT `;

    // Detect aggregations
    if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
      const column = this.extractColumnName(lowerQuery, dataset);
      sql += `AVG(${column})`;
    } else if (lowerQuery.includes('sum') || lowerQuery.includes('total')) {
      const column = this.extractColumnName(lowerQuery, dataset);
      sql += `SUM(${column})`;
    } else if (lowerQuery.includes('count')) {
      sql += `COUNT(*)`;
    } else if (lowerQuery.includes('max') || lowerQuery.includes('maximum')) {
      const column = this.extractColumnName(lowerQuery, dataset);
      sql += `MAX(${column})`;
    } else if (lowerQuery.includes('min') || lowerQuery.includes('minimum')) {
      const column = this.extractColumnName(lowerQuery, dataset);
      sql += `MIN(${column})`;
    } else {
      sql += `*`;
    }

    sql += ` FROM ${dataset.name}`;

    // Detect filters
    if (lowerQuery.includes('where') || lowerQuery.includes('filter')) {
      sql += ` WHERE ${this.extractWhereClause(lowerQuery, dataset)}`;
    }

    // Detect grouping
    if (lowerQuery.includes('group by') || lowerQuery.includes('by')) {
      const groupColumn = this.extractColumnName(lowerQuery, dataset);
      sql += ` GROUP BY ${groupColumn}`;
    }

    // Detect ordering
    if (lowerQuery.includes('order by') || lowerQuery.includes('sort')) {
      const orderColumn = this.extractColumnName(lowerQuery, dataset);
      const direction = lowerQuery.includes('desc') ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${orderColumn} ${direction}`;
    }

    // Detect limit
    if (lowerQuery.includes('top') || lowerQuery.includes('limit')) {
      const limitMatch = lowerQuery.match(/(\d+)/);
      if (limitMatch) {
        sql += ` LIMIT ${limitMatch[1]}`;
      }
    }

    return sql;
  }

  private extractColumnName(query: string, dataset: Dataset): string {
    // Find column name in query
    for (const column of dataset.columns) {
      if (query.toLowerCase().includes(column.name.toLowerCase())) {
        return column.name;
      }
    }

    return dataset.columns[0]?.name || '*';
  }

  private extractWhereClause(query: string, dataset: Dataset): string {
    // Simple extraction (in production, use proper parser)
    return '1=1'; // Placeholder
  }

  private executeQuery(dataset: Dataset, sql: string): any[] {
    // Simple query executor (in production, use SQL engine like alasql)
    // For now, return filtered data based on SQL patterns

    if (sql.includes('COUNT(*)')) {
      return [{ count: dataset.rowCount }];
    }

    if (sql.includes('AVG')) {
      const columnMatch = sql.match(/AVG\((\w+)\)/);
      if (columnMatch) {
        const column = columnMatch[1];
        const values = dataset.rows.map(row => Number(row[column])).filter(v => !isNaN(v));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return [{ average: avg }];
      }
    }

    // Return all data as fallback
    return dataset.rows;
  }

  // ========================
  // Visualization Recommendations
  // ========================

  recommendVisualizations(datasetId: string): VisualizationRecommendation[] {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) return [];

    const recommendations: VisualizationRecommendation[] = [];

    const numericColumns = dataset.columns.filter(c => c.type === 'number');
    const categoricalColumns = dataset.columns.filter(c => c.type === 'string');

    // Bar chart for categorical vs numeric
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      recommendations.push({
        type: 'bar',
        title: `${numericColumns[0].name} by ${categoricalColumns[0].name}`,
        description: 'Compare values across categories',
        xAxis: categoricalColumns[0].name,
        yAxis: numericColumns[0].name,
        config: {},
        priority: 90,
      });
    }

    // Line chart for time series
    const dateColumns = dataset.columns.filter(c => c.type === 'date');
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      recommendations.push({
        type: 'line',
        title: `${numericColumns[0].name} over time`,
        description: 'Visualize trends over time',
        xAxis: dateColumns[0].name,
        yAxis: numericColumns[0].name,
        config: {},
        priority: 95,
      });
    }

    // Scatter plot for correlation
    if (numericColumns.length >= 2) {
      recommendations.push({
        type: 'scatter',
        title: `${numericColumns[0].name} vs ${numericColumns[1].name}`,
        description: 'Explore relationship between variables',
        xAxis: numericColumns[0].name,
        yAxis: numericColumns[1].name,
        config: {},
        priority: 80,
      });
    }

    // Pie chart for distribution
    if (categoricalColumns.length > 0) {
      recommendations.push({
        type: 'pie',
        title: `Distribution of ${categoricalColumns[0].name}`,
        description: 'Show proportions',
        config: { dataColumn: categoricalColumns[0].name },
        priority: 70,
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // ========================
  // Data Export
  // ========================

  exportToCSV(datasetId: string): string {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    const headers = dataset.columns.map(c => c.name).join(',');
    const rows = dataset.rows.map(row => {
      return dataset.columns.map(c => row[c.name]).join(',');
    });

    return [headers, ...rows].join('\n');
  }

  exportToJSON(datasetId: string): string {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    return JSON.stringify(dataset.rows, null, 2);
  }

  // ========================
  // Dataset Management
  // ========================

  getDataset(id: string): Dataset | undefined {
    return this.datasets.get(id);
  }

  listDatasets(): Dataset[] {
    return Array.from(this.datasets.values());
  }

  deleteDataset(id: string): boolean {
    return this.datasets.delete(id);
  }
}

const dataAnalysisService = new DataAnalysisService();
export default dataAnalysisService;
