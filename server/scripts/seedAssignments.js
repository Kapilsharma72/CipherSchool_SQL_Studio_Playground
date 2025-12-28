require('dotenv').config();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await mongoose.connection.db.admin().ping();
    console.log(' MongoDB connected successfully');
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const sampleAssignments = [
  {
    title: 'Basic SELECT Queries',
    description: 'Learn the fundamentals of retrieving data from a database using SELECT statements. This is your first step into SQL querying.',
    difficulty: 'Easy',
    question: 'Write a SQL query to retrieve all columns and all rows from the employees table. Use SELECT * to get all columns.',
    schemaName: 'assignment_1_basic_select',
    sampleTables: [
      {
        tableName: 'employees',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'email', dataType: 'VARCHAR' },
          { columnName: 'department', dataType: 'VARCHAR' },
          { columnName: 'salary', dataType: 'DECIMAL' },
          { columnName: 'hire_date', dataType: 'DATE' }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' }
        ]
      }
    ],
    expectedOutput: {
      type: 'table',
      value: [
        { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
        { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
        { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' }
      ]
    }
  },
  {
    title: 'Filtering with WHERE Clause',
    description: 'Practice using WHERE clause to filter data based on specific conditions. Learn to retrieve only the data you need.',
    difficulty: 'Easy',
    question: 'Write a SQL query to find all employees who work in the Engineering department. Use the WHERE clause to filter by department.',
    schemaName: 'assignment_2_where_clause',
    sampleTables: [
      {
        tableName: 'employees',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'email', dataType: 'VARCHAR' },
          { columnName: 'department', dataType: 'VARCHAR' },
          { columnName: 'salary', dataType: 'DECIMAL' },
          { columnName: 'hire_date', dataType: 'DATE' }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' }
        ]
      }
    ],
    expectedOutput: {
      type: 'table',
      value: [
        { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
        { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' }
      ]
    }
  },
  {
    title: 'JOIN Operations',
    description: 'Learn how to combine data from multiple tables using JOIN operations. Master the art of relating data across tables.',
    difficulty: 'Medium',
    question: 'Write a SQL query to retrieve employee names along with their department locations. Join the employees table with the departments table using the department name. Display columns: employee name and department location.',
    schemaName: 'assignment_3_join_operations',
    sampleTables: [
      {
        tableName: 'employees',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'email', dataType: 'VARCHAR' },
          { columnName: 'department', dataType: 'VARCHAR' },
          { columnName: 'salary', dataType: 'DECIMAL' },
          { columnName: 'hire_date', dataType: 'DATE' }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' }
        ]
      },
      {
        tableName: 'departments',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'location', dataType: 'VARCHAR' },
          { columnName: 'budget', dataType: 'DECIMAL' }
        ],
        rows: [
          { id: 1, name: 'Engineering', location: 'Building A', budget: 1000000 },
          { id: 2, name: 'Marketing', location: 'Building B', budget: 500000 },
          { id: 3, name: 'Sales', location: 'Building C', budget: 750000 }
        ]
      }
    ],
    expectedOutput: {
      type: 'table',
      value: [
        { name: 'John Doe', location: 'Building A' },
        { name: 'Jane Smith', location: 'Building B' },
        { name: 'Bob Johnson', location: 'Building C' },
        { name: 'Alice Williams', location: 'Building A' },
        { name: 'Charlie Brown', location: 'Building B' }
      ]
    }
  },
  {
    title: 'Aggregate Functions and GROUP BY',
    description: 'Learn to use aggregate functions like COUNT, SUM, AVG with GROUP BY clause to summarize data.',
    difficulty: 'Medium',
    question: 'Write a SQL query to find the total number of employees in each department. Use COUNT() function and GROUP BY clause. Display department name and the count of employees.',
    schemaName: 'assignment_4_aggregate_functions',
    sampleTables: [
      {
        tableName: 'employees',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'email', dataType: 'VARCHAR' },
          { columnName: 'department', dataType: 'VARCHAR' },
          { columnName: 'salary', dataType: 'DECIMAL' },
          { columnName: 'hire_date', dataType: 'DATE' }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' },
          { id: 6, name: 'David Lee', email: 'david@example.com', department: 'Sales', salary: 72000, hire_date: '2021-08-20' }
        ]
      }
    ],
    expectedOutput: {
      type: 'table',
      value: [
        { department: 'Engineering', count: 2 },
        { department: 'Marketing', count: 2 },
        { department: 'Sales', count: 2 }
      ]
    }
  },
  {
    title: 'ORDER BY and LIMIT',
    description: 'Learn to sort results using ORDER BY and limit the number of rows returned using LIMIT clause.',
    difficulty: 'Easy',
    question: 'Write a SQL query to find the top 3 highest paid employees. Order the results by salary in descending order and limit to 3 rows. Display employee name and salary.',
    schemaName: 'assignment_5_order_by_limit',
    sampleTables: [
      {
        tableName: 'employees',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'email', dataType: 'VARCHAR' },
          { columnName: 'department', dataType: 'VARCHAR' },
          { columnName: 'salary', dataType: 'DECIMAL' },
          { columnName: 'hire_date', dataType: 'DATE' }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' },
          { id: 6, name: 'David Lee', email: 'david@example.com', department: 'Sales', salary: 72000, hire_date: '2021-08-20' }
        ]
      }
    ],
    expectedOutput: {
      type: 'table',
      value: [
        { name: 'Alice Williams', salary: 95000 },
        { name: 'John Doe', salary: 85000 },
        { name: 'Jane Smith', salary: 75000 }
      ]
    }
  },
  {
    title: 'Complex JOIN with Multiple Conditions',
    description: 'Master complex JOIN operations with multiple conditions and learn to combine data from multiple related tables.',
    difficulty: 'Hard',
    question: 'Write a SQL query to find all employees with their department information including location and budget. Join employees with departments table. Also filter to show only employees with salary greater than 70000. Display: employee name, department name, location, and salary.',
    schemaName: 'assignment_6_complex_join',
    sampleTables: [
      {
        tableName: 'employees',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'email', dataType: 'VARCHAR' },
          { columnName: 'department', dataType: 'VARCHAR' },
          { columnName: 'salary', dataType: 'DECIMAL' },
          { columnName: 'hire_date', dataType: 'DATE' }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 75000, hire_date: '2021-03-22' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 65000, hire_date: '2022-06-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', department: 'Engineering', salary: 95000, hire_date: '2019-11-05' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Marketing', salary: 70000, hire_date: '2022-01-30' },
          { id: 6, name: 'David Lee', email: 'david@example.com', department: 'Sales', salary: 72000, hire_date: '2021-08-20' }
        ]
      },
      {
        tableName: 'departments',
        columns: [
          { columnName: 'id', dataType: 'INTEGER' },
          { columnName: 'name', dataType: 'VARCHAR' },
          { columnName: 'location', dataType: 'VARCHAR' },
          { columnName: 'budget', dataType: 'DECIMAL' }
        ],
        rows: [
          { id: 1, name: 'Engineering', location: 'Building A', budget: 1000000 },
          { id: 2, name: 'Marketing', location: 'Building B', budget: 500000 },
          { id: 3, name: 'Sales', location: 'Building C', budget: 750000 }
        ]
      }
    ],
    expectedOutput: {
      type: 'table',
      value: [
        { name: 'John Doe', department: 'Engineering', location: 'Building A', salary: 85000 },
        { name: 'Jane Smith', department: 'Marketing', location: 'Building B', salary: 75000 },
        { name: 'Alice Williams', department: 'Engineering', location: 'Building A', salary: 95000 },
        { name: 'David Lee', department: 'Sales', location: 'Building C', salary: 72000 }
      ]
    }
  }
];

const seedAssignments = async () => {
  try {
    await connectMongoDB();
    
        await Assignment.deleteMany({});
    console.log('  Cleared existing assignments');
    
        const created = await Assignment.insertMany(sampleAssignments);
    console.log(` Created ${created.length} sample assignments`);
    
    console.log('\n Sample Assignments:');
    created.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.title} (${assignment.difficulty}) - Schema: ${assignment.schemaName}`);
    });
    
    console.log('\n Next step: Run "npm run setup-pg" to create PostgreSQL schemas and tables');
    process.exit(0);
  } catch (error) {
    console.error(' Error seeding assignments:', error);
    process.exit(1);
  }
};

seedAssignments();

