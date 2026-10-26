# Task Tracker – Database

## **Overview**

This lab extends the existing Task Tracker API by introducing persistent storage using a database. Learners will connect their Express.js application to a real database, define data models/schemas, perform CRUD operations, and implement secure environment configuration and proper error handling.

## **Learning Objectives**

By the end of this lab, learners should be able to:

- Connect an Express.js application to a database such as MongoDB, PostgreSQL, or MySQL.

- Define and use data models or schemas for structured data storage.

- Perform CRUD operations using persistent storage.

- Use environment variables to securely manage database configuration.

- Apply async/await and proper error handling for database operations.

## **Project: Persistent Task Tracker API**

You will enhance the Task Tracker API built in the previous module by replacing in-memory storage with a database.

### **Task Record Structure**

| **Field** | **Description** |
| --- | --- |
| id | Unique database-generated identifier |
| title | Task name or description *(required)* |
| completed | Boolean indicating task completion status |
| createdAt | Timestamp showing when the task was created |

## **Lab Requirements**

### **1. Database Setup**

- Choose and configure a database system:

- MongoDB

- PostgreSQL

- MySQL

- or another supported database

- Create a database named: ```bash task_tracker_db
