/**
 * LLM prompts for SQL generation
 */

/**
 * System prompt for SQL generation
 */
export const SQL_GENERATION_SYSTEM_PROMPT = `You are an expert SQL query generator. Your task is to convert natural language questions into valid SQL queries.

IMPORTANT RULES:
1. Generate ONLY SELECT queries - no INSERT, UPDATE, DELETE, DROP, CREATE, or ALTER statements
2. Always use proper table and column names from the provided schema
3. Use appropriate JOINs when querying multiple tables
4. Include relevant WHERE clauses to filter data as needed
5. Use ORDER BY when the question implies sorting
6. Use GROUP BY with aggregate functions (COUNT, SUM, AVG, etc.) when appropriate
7. Use LIMIT to restrict results when the question asks for "top N" or similar
8. Handle NULL values appropriately
9. Use aliases for readability in complex queries
10. Return ONLY the SQL query, no explanations or markdown formatting

When uncertain about column names or relationships, make reasonable assumptions based on common database conventions.`;

/**
 * Generate the user prompt with schema context
 */
export function generateUserPrompt(question: string, schemaContext: string): string {
  return `Given the following database schema:

${schemaContext}

Convert this question to a SQL query:
"${question}"

Return ONLY the SQL query, nothing else.`;
}

/**
 * Prompt for explaining a SQL query
 */
export const SQL_EXPLANATION_SYSTEM_PROMPT = `You are an expert SQL analyst. Explain SQL queries in simple terms that a non-technical user can understand.

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no **, no *, no #, no \`\`\`)
- Use plain text only
- Use "•" (bullet character) for lists, not asterisks
- Keep explanations concise and clear
- Do NOT include headers like "Query Explanation:" - just explain directly`;

/**
 * Generate explanation prompt for a query
 */
export function generateExplanationPrompt(sql: string): string {
  return `Explain this SQL query in simple, plain text (no markdown):

${sql}

Provide a brief, clear explanation of what this query does and what data it retrieves.`;
}

/**
 * Prompt for fixing SQL errors
 */
export const SQL_ERROR_FIX_SYSTEM_PROMPT = `You are an expert SQL debugger. Your task is to fix SQL queries that have errors. Analyze the error message and the query, then provide a corrected version.

IMPORTANT RULES:
1. Generate ONLY SELECT queries - no INSERT, UPDATE, DELETE, DROP, CREATE, or ALTER statements
2. Return ONLY the corrected SQL query, no explanations
3. Fix syntax errors, incorrect column/table names, and logical issues
4. Preserve the original intent of the query`;

/**
 * Generate error fix prompt
 */
export function generateErrorFixPrompt(sql: string, error: string, schemaContext: string): string {
  return `The following SQL query failed with an error:

Query:
\`\`\`sql
${sql}
\`\`\`

Error message:
${error}

Database schema:
${schemaContext}

Provide the corrected SQL query. Return ONLY the SQL, nothing else.`;
}

/**
 * System prompt for chart suggestion
 */
export const CHART_SUGGESTION_SYSTEM_PROMPT = `You are a data visualization expert. Analyze the query results and suggest the best chart type and configuration.

IMPORTANT RULES:
1. Respond with ONLY valid JSON, no markdown or explanations
2. Choose from these chart types: "bar", "line", "pie"
3. Select appropriate columns for X and Y axes based on data types
4. Provide a brief explanation of why this chart type is best

Use these guidelines:
- Bar charts: Best for comparing categories or showing discrete values
- Line charts: Best for showing trends over time or continuous data
- Pie charts: Best for showing parts of a whole (use only when there are few categories)`;

/**
 * Generate chart suggestion prompt
 */
export function generateChartSuggestionPrompt(
  columns: Array<{ name: string; dataType: string }>,
  sampleRows: Array<Record<string, unknown>>,
  rowCount: number
): string {
  const columnInfo = columns.map((c) => `${c.name} (${c.dataType})`).join(', ');
  const sampleData = JSON.stringify(sampleRows.slice(0, 3), null, 2);

  return `Analyze this query result and suggest the best chart visualization:

Columns: ${columnInfo}
Total rows: ${rowCount}
Sample data:
${sampleData}

Respond with ONLY this JSON structure (no markdown):
{
  "chartType": "bar" | "line" | "pie",
  "xAxis": "column_name_for_x_axis",
  "yAxis": "column_name_for_y_axis",
  "explanation": "Brief explanation of why this visualization is recommended"
}`;
}

