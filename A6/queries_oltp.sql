CREATE TABLE Customer (
    Customer_id INT PRIMARY KEY,
    Customer_name VARCHAR(100),
    City_id INT,
    First_order_date DATE
);

CREATE TABLE Walk_in_customers (
    Customer_id INT REFERENCES Customer(Customer_id),
    tourism_guide VARCHAR(100),
    Time TIMESTAMP
);

CREATE TABLE Mail_order_customers (
    Customer_id INT REFERENCES Customer(Customer_id),
    post_address TEXT,
    Time TIMESTAMP
);

CREATE TABLE Headquarters (
    City_id INT PRIMARY KEY,
    City_name VARCHAR(100),
    Headquarter_addr TEXT,
    State VARCHAR(100),
    Time TIMESTAMP
);

CREATE TABLE Stores (
    Store_id INT PRIMARY KEY,
    City_id INT REFERENCES Headquarters(City_id),
    Phone VARCHAR(15),
    Time TIMESTAMP
);

CREATE TABLE Items (
    Item_id INT PRIMARY KEY,
    Description VARCHAR(100),
    Size VARCHAR(50),
    Weight DECIMAL,
    Unit_price DECIMAL,
    Time TIMESTAMP
);

CREATE TABLE Stored_items (
    Store_id INT REFERENCES Stores(Store_id),
    Item_id INT REFERENCES Items(Item_id),
    Quantity_held INT,
    Time TIMESTAMP,
    PRIMARY KEY(Store_id, Item_id)
);

CREATE TABLE Orders (
    Order_no INT PRIMARY KEY,
    Order_date DATE,
    Customer_id INT REFERENCES Customer(Customer_id)
);

CREATE TABLE Ordered_item (
    Order_no INT REFERENCES Orders(Order_no),
    Item_id INT REFERENCES Items(Item_id),
    Quantity_ordered INT,
    Ordered_price DECIMAL,
    Time TIMESTAMP,
    PRIMARY KEY(Order_no, Item_id)
);

INSERT INTO Headquarters VALUES
(1,'Mumbai','Bandra HQ','Maharashtra',NOW()),
(2,'Pune','Shivajinagar HQ','Maharashtra',NOW()),
(3,'Delhi','Connaught HQ','Delhi',NOW()),
(4,'Bangalore','MG Road HQ','Karnataka',NOW());

INSERT INTO Stores VALUES
(101,1,'9000000001',NOW()),
(102,1,'9000000002',NOW()),
(103,2,'9000000003',NOW()),
(104,2,'9000000004',NOW()),
(105,3,'9000000005',NOW()),
(106,4,'9000000006',NOW());

INSERT INTO Items VALUES
(1,'Laptop','15 inch',2.2,55000,NOW()),
(2,'Mobile','6 inch',0.3,20000,NOW()),
(3,'Printer','Medium',5.0,15000,NOW()),
(4,'Tablet','10 inch',0.8,30000,NOW()),
(5,'Keyboard','Standard',0.5,1000,NOW()),
(6,'Mouse','Wireless',0.2,800,NOW());

INSERT INTO Stored_items VALUES
(101,1,20,NOW()),
(101,2,50,NOW()),
(101,5,100,NOW()),
(102,1,10,NOW()),
(102,3,25,NOW()),
(103,2,60,NOW()),
(103,4,40,NOW()),
(104,1,15,NOW()),
(104,6,200,NOW()),
(105,3,30,NOW()),
(105,4,20,NOW()),
(106,1,50,NOW()),
(106,2,80,NOW()),
(106,5,150,NOW());

INSERT INTO Customer VALUES
(1,'Amit',1,'2025-01-10'),
(2,'Sneha',2,'2025-01-12'),
(3,'Rahul',3,'2025-01-15'),
(4,'Priya',4,'2025-01-20'),
(5,'Karan',1,'2025-02-01');

INSERT INTO Walk_in_customers VALUES
(1,'Guide1',NOW()),
(2,'Guide2',NOW()),
(5,'Guide3',NOW());

INSERT INTO Mail_order_customers VALUES
(3,'Delhi Address',NOW()),
(4,'Bangalore Address',NOW()),
(5,'Mumbai Address',NOW());

INSERT INTO Orders VALUES
(1001,'2025-02-10',1),
(1002,'2025-02-11',2),
(1003,'2025-02-12',3),
(1004,'2025-02-13',5);

INSERT INTO Ordered_item VALUES
(1001,1,2,110000,NOW()),
(1001,5,1,1000,NOW()),
(1002,2,3,60000,NOW()),
(1003,3,1,15000,NOW()),
(1004,1,1,55000,NOW()),
(1004,2,2,40000,NOW());