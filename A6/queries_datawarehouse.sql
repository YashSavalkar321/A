-- Enable FDW
CREATE EXTENSION postgres_fdw;

-- Create Server Connection
CREATE SERVER oltp_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (dbname 'ads_assignment6_oltp', host 'localhost');

-- User Mapping
CREATE USER MAPPING FOR CURRENT_USER
SERVER oltp_server
OPTIONS (user 'postgres', password 'Yash@321');

-- Import OLTP Tables
IMPORT FOREIGN SCHEMA public
FROM SERVER oltp_server
INTO public;

-- Create Dimension Tables
CREATE TABLE Dim_Customer AS
SELECT Customer_id, Customer_name, City_id FROM Customer;
ALTER TABLE Dim_Customer
ADD PRIMARY KEY (Customer_id);

CREATE TABLE Dim_Store AS
SELECT s.Store_id, s.City_id, h.City_name, h.State
FROM Stores s JOIN Headquarters h
ON s.City_id = h.City_id;
ALTER TABLE Dim_Store
ADD PRIMARY KEY (Store_id);

CREATE TABLE Dim_Item AS
SELECT Item_id, Description, Size, Weight, Unit_price
FROM Items;
ALTER TABLE Dim_Item
ADD PRIMARY KEY (Item_id);

CREATE TABLE Dim_Time AS
SELECT DISTINCT Order_date AS Date,
EXTRACT(YEAR FROM Order_date) AS Year,
EXTRACT(MONTH FROM Order_date) AS Month
FROM Orders;

-- Fact table
CREATE TABLE Sales_Fact AS
SELECT o.Order_no,
       o.Customer_id,
       oi.Item_id,
       oi.Quantity_ordered,
       oi.Ordered_price,
       o.Order_date
FROM Orders o
JOIN Ordered_item oi
ON o.Order_no = oi.Order_no;

SELECT o.Order_no, c.Customer_name, o.Order_date
FROM Orders o
JOIN Customer c ON o.Customer_id = c.Customer_id
JOIN Ordered_item oi ON o.Order_no = oi.Order_no
JOIN Stored_items si ON oi.Item_id = si.Item_id
WHERE si.Store_id = 101;

-- OLAP Queries 

-- Roll Up
SELECT h.City_name,
SUM(sf.Quantity_ordered) AS Total_Sales
FROM Sales_Fact sf
JOIN Dim_Customer dc ON sf.Customer_id = dc.Customer_id
JOIN Headquarters h ON dc.City_id = h.City_id
GROUP BY h.City_name;

-- Drill-Down
SELECT h.City_name, s.Store_id,
SUM(si.Quantity_held)
FROM Stored_items si
JOIN Stores s ON si.Store_id = s.Store_id
JOIN Headquarters h ON s.City_id = h.City_id
GROUP BY h.City_name, s.Store_id;

-- Slice
SELECT * FROM Sales_Fact
WHERE EXTRACT(YEAR FROM Order_date)=2025;

-- Dice
SELECT * FROM Sales_Fact
WHERE Quantity_ordered > 1
AND Ordered_price > 50000;

