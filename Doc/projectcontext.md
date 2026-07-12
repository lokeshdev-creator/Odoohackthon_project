Full Project Context for Antigravity
Project Name

TransitOps – Smart Transport Operations Platform

Project Objective

Build a modern, production-ready Transport Operations Management System that digitizes fleet management for logistics companies.

The platform replaces spreadsheets and manual registers with a centralized web application that manages:

Fleet
Drivers
Trips
Dispatch
Maintenance
Fuel
Expenses
Reports
Analytics

The system must enforce business rules automatically and provide real-time operational visibility.

Problem Statement

Most logistics companies manage transportation using Excel sheets and paper logbooks.

This creates problems like:

Vehicle scheduling conflicts
Driver conflicts
Expired licenses
Missed maintenance
Poor expense tracking
Duplicate dispatches
Low fleet utilization
No real-time dashboard
No centralized data

TransitOps solves all these problems.

Target Users
Fleet Manager

Responsible for:

Vehicle lifecycle
Fleet utilization
Maintenance
Vehicle registration
Dispatcher

Responsible for:

Creating trips
Assigning drivers
Assigning vehicles
Monitoring trips
Safety Officer

Responsible for:

Driver compliance
License validity
Safety score
Suspended drivers
Financial Analyst

Responsible for:

Fuel expenses
Maintenance costs
Operational cost
ROI
Reports
Core Modules
1 Authentication

Features

Email Login
Password Login
JWT Authentication
Role Based Access Control
Protected Routes
Session Management

Roles

Admin
Fleet Manager
Dispatcher
Safety Officer
Financial Analyst
2 Dashboard

Display KPIs

Active Vehicles
Available Vehicles
Vehicles On Trip
Vehicles In Maintenance
Active Trips
Pending Trips
Drivers On Duty
Fleet Utilization %
Monthly Fuel Cost
Operational Cost

Charts

Trips per Month
Fuel Consumption
Expense Breakdown
Fleet Utilization
Vehicle Status Distribution
Driver Status Distribution

Filters

Vehicle Type
Region
Date Range
Vehicle Status
3 Vehicle Management

CRUD operations

Fields

Registration Number (Unique)
Vehicle Name
Vehicle Model
Vehicle Type
Maximum Load Capacity
Odometer
Acquisition Cost
Purchase Date
Status

Vehicle Status

Available
On Trip
In Shop
Retired

Rules

Registration Number must be unique.

Retired vehicles cannot be assigned.

Vehicles in maintenance cannot be assigned.

4 Driver Management

CRUD

Fields

Name
License Number
License Category
License Expiry
Contact Number
Email
Safety Score
Status

Driver Status

Available
On Trip
Off Duty
Suspended

Rules

Expired license cannot be assigned.

Suspended driver cannot be assigned.

Driver already on trip cannot be assigned again.

5 Trip Management

Trip Lifecycle

Draft

↓

Dispatched

↓

Completed

or

Cancelled

Trip Fields

Source
Destination
Vehicle
Driver
Cargo Weight
Planned Distance
Actual Distance
Start Date
End Date
Revenue
Fuel Used

Business Rules

Vehicle must be Available.

Driver must be Available.

License must be valid.

Cargo Weight ≤ Vehicle Capacity.

Vehicle cannot be assigned twice.

Driver cannot be assigned twice.

Dispatch automatically changes

Vehicle → On Trip

Driver → On Trip

Complete Trip automatically changes

Vehicle → Available

Driver → Available

Cancel Trip restores

Vehicle → Available

Driver → Available

6 Maintenance Module

Maintenance Fields

Vehicle
Service Type
Description
Cost
Start Date
Completion Date
Status

Rules

Creating maintenance

↓

Vehicle Status

↓

In Shop

Vehicle disappears from dispatch.

Closing maintenance

↓

Vehicle becomes Available

unless Retired.

7 Fuel Management

Fields

Vehicle
Trip
Fuel Liters
Fuel Cost
Date

Automatically calculate

Fuel Efficiency

Distance / Fuel

8 Expense Management

Expense Types

Fuel
Toll
Repair
Maintenance
Insurance
Miscellaneous

Track

Amount
Date
Category
Vehicle
Notes

Automatically calculate

Operational Cost

Fuel + Maintenance + Expenses

9 Reports

Generate

Fleet Utilization

Fuel Efficiency

Maintenance Cost

Operational Cost

Vehicle ROI

Driver Performance

Monthly Expenses

Driver History (Which driver took which car, when they departed/returned, fuel consumed, etc.)

Export

CSV

Optional PDF

Dashboard KPIs

Active Vehicles

Available Vehicles

Drivers Available

Drivers On Trip

Trips Today

Trips This Month

Fleet Utilization

Fuel Cost

Maintenance Cost

Revenue

Profit

Vehicle ROI

Database Design

Users

id
name
email
password
role

Vehicles

id
registrationNumber
name
model
type
capacity
odometer
acquisitionCost
status

Drivers

id
name
licenseNumber
expiryDate
safetyScore
status

Trips

id
vehicleId
driverId
source
destination
cargoWeight
plannedDistance
actualDistance
revenue
status

MaintenanceLogs

id
vehicleId
type
cost
startDate
endDate
status

FuelLogs

id
vehicleId
tripId
liters
cost
date

Expenses

id
vehicleId
category
amount
date
Business Rules

Enforce automatically

✓ Unique Registration Number

✓ Driver License Validation

✓ Driver Availability Validation

✓ Vehicle Availability Validation

✓ Cargo Capacity Validation

✓ Automatic Status Updates

✓ Maintenance Locking

✓ Trip Completion Workflow

✓ Cost Calculation

✓ Fuel Efficiency Calculation

✓ ROI Calculation

UI Requirements

Modern SaaS Dashboard

Responsive

Dark Mode

Light Mode

Search

Sorting

Filtering

Pagination

Data Tables

Cards

Charts

Dialogs

Toast Notifications

Loading States

Empty States

Form Validation

Professional Design

Target Tech Stack

Frontend

- Next.js 16/15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Lucide React
- React Hook Form
- Zod
- TanStack Query
- Recharts
- Sonner

Backend

- Next.js Route Handlers + Server Actions
- MongoDB Atlas
- Mongoose (ODM)

Database

- MongoDB Atlas

Authentication

- Auth.js (NextAuth v5)
- JWT Authentication
- Credentials Login
- Role-Based Access Control (RBAC)

Storage

- Cloudinary (for vehicle documents)

Export

- jsPDF
- PapaParse

Notifications

- Resend Email API

Theme

- Dark & Light Mode (next-themes)
Bonus Features
Email reminders for expiring licenses
Vehicle document management
Advanced analytics
Audit logs
Notification center
Multi-region support
CSV and PDF export
Real-time dashboard updates
Activity history
Development Goal

Build a production-quality application with clean architecture, modular components, scalable APIs, secure authentication, robust validation, responsive UI, and maintainable code. Prioritize business-rule enforcement, user experience, and operational efficiency over a minimal hackathon prototype.