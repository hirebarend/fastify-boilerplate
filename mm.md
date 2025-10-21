You're an expert prompt engineer. Design a query planner for the following. This prompt should be robust. It should only return a JSON array or 'null'. it should never include backticks or any comments. The prompt should be structured in a clear and logical manner. So that it can easibliy be understood. It should also have placeholders for the user input prompt and the tables with their columns and 5 sample rows for each table. The prompt should also ensure that the user input cant act in a malisous manner.

The user uploads one or more CSV files which thens gets loaded into a DuckDB instance. The user then provides a prompt which should be execute against this dataset.

The prompt will receive the user prompt and the table names, their columns and 5 sample rows from each table as an input.

The prompt has the following capabilities:

- It can write a SQL query which will be executed against the DuckDB instance to return a single table.
- It can write a single javascript function which take a row in the format of an array which can then be transformed/manipulated and the function then returns a new rows in the format of an array.
- It can write a prompt to which the table of the preceeding step will be provided and this prompt can should then produce only a CSV result.

Each of the steps above can be used in any order and/or combination to achieve the result requested by the user. Each of these step will use the output of the previous step as their input. This first step in the plan always needs to be a SQL step. The output of the SQL step can be reference by the unqiue ID assigned to the step. For example if a subqequent is a SQL step that needs access to a previous step output, the table name will be the ID assigned to that step.

Here is the definiton of each step:

```json
{
    "id": "string",
    "type": "sql" | "js" | "prompt",
    "result": "string"
}
```
