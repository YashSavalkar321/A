-- product dimension
CREATE TABLE DimProduct (
    ProductKey SERIAL PRIMARY KEY,
    ProductName VARCHAR(100),
    Category VARCHAR(50),
    ProductCost DECIMAL(10,2)
);

-- customer
CREATE TABLE DimCustomer (
    CustomerID SERIAL PRIMARY KEY,
    CustomerName VARCHAR(100),
    Gender VARCHAR(10),
    City VARCHAR(50)
);

-- store
CREATE TABLE DimStore (
    StoreID SERIAL PRIMARY KEY,
    StoreName VARCHAR(100),
    City VARCHAR(50),
    State VARCHAR(50),
    Country VARCHAR(50)
);

-- salesperson
CREATE TABLE DimSalesPerson (
    SalesPersonID SERIAL PRIMARY KEY,
    SalesPersonName VARCHAR(100),
    City VARCHAR(50)
);

-- date
CREATE TABLE DimDate (
    DateKey SERIAL PRIMARY KEY,
    FullDate DATE,
    Day INT,
    Month INT,
    MonthName VARCHAR(20),
    Quarter INT,
    Year INT,
    Weekday VARCHAR(20),
    IsWeekend BOOLEAN
);

-- time
CREATE TABLE DimTime (
    TimeKey SERIAL PRIMARY KEY,
    Hour INT,
    DayTimeBucket VARCHAR(20)
);

-- fact table for sales transactions
CREATE TABLE FactProductSales (
    TransactionID SERIAL PRIMARY KEY,
    InvoiceNumber VARCHAR(20),

    DateKey INT REFERENCES DimDate(DateKey),
    TimeKey INT REFERENCES DimTime(TimeKey),
    ProductID INT REFERENCES DimProduct(ProductKey),
    CustomerID INT REFERENCES DimCustomer(CustomerID),
    StoreID INT REFERENCES DimStore(StoreID),
    SalesPersonID INT REFERENCES DimSalesPerson(SalesPersonID),

    Quantity INT,
    TotalSales DECIMAL(12,2),
    ActualCost DECIMAL(12,2)
);

INSERT INTO DimProduct (ProductName, Category, ProductCost) VALUES
('Laptop','Electronics',40000),
('Mobile','Electronics',15000),
('TV','Electronics',30000),
('Shoes','Fashion',2000),
('Shirt','Fashion',1200),
('Watch','Accessories',2500),
('Bag','Accessories',1800),
('Refrigerator','Electronics',25000),
('Washing Machine','Electronics',22000),
('Headphones','Electronics',1500),
('Tablet','Electronics',20000),
('Jeans','Fashion',1800),
('Sofa','Furniture',35000),
('Chair','Furniture',3000),
('Bed','Furniture',25000),
('Microwave','Electronics',10000),
('Blender','Home Appliance',3000),
('Toys','Kids',800),
('Books','Stationary',500),
('Perfume','Cosmetics',2500);

INSERT INTO DimStore (StoreName, City, State, Country) VALUES
('XMart Andheri','Mumbai','Maharashtra','India'),
('XMart Thane','Thane','Maharashtra','India'),
('XMart Pune','Pune','Maharashtra','India'),
('XMart Navi Mumbai','Navi Mumbai','Maharashtra','India');

INSERT INTO DimSalesPerson (SalesPersonName, City) VALUES
('Rahul','Mumbai'),
('Sneha','Thane'),
('Amit','Pune'),
('Priya','Navi Mumbai');

INSERT INTO DimCustomer (CustomerName, Gender, City)
SELECT 
    'Customer_' || generate_series,
    CASE WHEN generate_series % 2 = 0 THEN 'Female' ELSE 'Male' END,
    'Mumbai'
FROM generate_series(1,30);

INSERT INTO DimDate (FullDate, Day, Month, MonthName, Quarter, Year, Weekday, IsWeekend)
SELECT 
    d::date,
    EXTRACT(DAY FROM d),
    EXTRACT(MONTH FROM d),
    TO_CHAR(d,'Month'),
    EXTRACT(QUARTER FROM d),
    EXTRACT(YEAR FROM d),
    TO_CHAR(d,'Day'),
    CASE WHEN EXTRACT(DOW FROM d) IN (0,6) THEN TRUE ELSE FALSE END
FROM generate_series('2025-01-01'::date,'2025-12-31'::date,'1 day') d;

INSERT INTO DimTime (Hour, DayTimeBucket)
SELECT h,
CASE 
    WHEN h BETWEEN 6 AND 11 THEN 'Morning'
    WHEN h BETWEEN 12 AND 17 THEN 'Afternoon'
    WHEN h BETWEEN 18 AND 21 THEN 'Evening'
    ELSE 'Night'
END
FROM generate_series(0,23) h;

INSERT INTO FactProductSales
(InvoiceNumber, DateKey, TimeKey, ProductID, CustomerID, StoreID, SalesPersonID, Quantity, TotalSales, ActualCost)
SELECT
    'INV' || gs,
    (RANDOM()*364 + 1)::INT,
    (RANDOM()*23 + 1)::INT,
    (RANDOM()*19 + 1)::INT,
    (RANDOM()*29 + 1)::INT,
    (RANDOM()*3 + 1)::INT,
    (RANDOM()*3 + 1)::INT,
    (RANDOM()*5 + 1)::INT,
    (RANDOM()*50000 + 1000)::DECIMAL,
    (RANDOM()*30000 + 500)::DECIMAL
FROM generate_series(1,1000) gs;

-- Calculate Daily Profit (Sales - Cost) for each Store
SELECT d.FullDate, s.StoreName,
SUM(f.TotalSales - f.ActualCost) AS Profit
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
JOIN DimStore s ON f.StoreID = s.StoreID
GROUP BY d.FullDate, s.StoreName
ORDER BY d.FullDate;

-- Calculate Weekly Total Sales
SELECT DATE_TRUNC('week', d.FullDate) AS Week,
SUM(f.TotalSales) AS WeeklySales
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
GROUP BY Week
ORDER BY Week;

-- Calculate Monthly Sales and Profit
SELECT d.MonthName,
SUM(f.TotalSales) AS MonthlySales,
SUM(f.TotalSales - f.ActualCost) AS Profit
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
GROUP BY d.MonthName;

-- Calculate Quarterly Profit
SELECT d.Quarter,
SUM(f.TotalSales - f.ActualCost) AS QuarterlyProfit
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
GROUP BY d.Quarter;

-- Find Product Demand (Total Quantity) in each City
SELECT p.ProductName, s.City,
SUM(f.Quantity) AS TotalQuantity
FROM FactProductSales f
JOIN DimProduct p ON f.ProductID = p.ProductKey
JOIN DimStore s ON f.StoreID = s.StoreID
GROUP BY p.ProductName, s.City
ORDER BY TotalQuantity DESC;

-- Calculate Sales based on Time of Day 
SELECT t.DayTimeBucket,
SUM(f.TotalSales) AS Sales
FROM FactProductSales f
JOIN DimTime t ON f.TimeKey = t.TimeKey
GROUP BY t.DayTimeBucket;

-- Find the Day with Highest Total Sales
SELECT d.FullDate,
SUM(f.TotalSales) AS TotalSales
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
GROUP BY d.FullDate
ORDER BY TotalSales DESC
LIMIT 1;

-- Compare Total Sales between Weekdays and Weekends
SELECT SUM(f.TotalSales) AS SundaySales
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
WHERE TRIM(d.Weekday) = 'Sunday';

-- Compare Total Sales between Weekdays and Weekends
SELECT d.IsWeekend,
SUM(f.TotalSales) AS TotalSales
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
GROUP BY d.IsWeekend;

-- Calculate Yearly Total Sales
SELECT d.Year,
SUM(f.TotalSales) AS YearlySales
FROM FactProductSales f
JOIN DimDate d ON f.DateKey = d.DateKey
GROUP BY d.Year;