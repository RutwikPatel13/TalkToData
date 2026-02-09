-- Insert sample employees
INSERT INTO employees (first_name, last_name, email, department, salary, hire_date, is_active) VALUES
('John', 'Smith', 'john.smith@company.com', 'Engineering', 95000, '2022-01-15', true),
('Sarah', 'Johnson', 'sarah.j@company.com', 'Engineering', 105000, '2021-06-01', true),
('Michael', 'Williams', 'michael.w@company.com', 'Sales', 75000, '2023-03-20', true),
('Emily', 'Brown', 'emily.b@company.com', 'Marketing', 68000, '2022-09-10', true),
('David', 'Jones', 'david.j@company.com', 'Engineering', 115000, '2020-02-28', true),
('Jessica', 'Davis', 'jessica.d@company.com', 'HR', 62000, '2023-01-05', true),
('Robert', 'Miller', 'robert.m@company.com', 'Sales', 82000, '2021-11-15', true),
('Amanda', 'Wilson', 'amanda.w@company.com', 'Marketing', 71000, '2022-07-22', true),
('James', 'Taylor', 'james.t@company.com', 'Engineering', 98000, '2021-04-18', false),
('Lisa', 'Anderson', 'lisa.a@company.com', 'Finance', 88000, '2020-08-30', true);

-- Insert sample products
INSERT INTO products (name, category, price, stock_quantity, description) VALUES
('Laptop Pro 15', 'Electronics', 1299.99, 45, 'High-performance laptop with 15-inch display'),
('Wireless Mouse', 'Electronics', 29.99, 200, 'Ergonomic wireless mouse'),
('Office Chair', 'Furniture', 349.99, 30, 'Ergonomic office chair with lumbar support'),
('Standing Desk', 'Furniture', 599.99, 15, 'Electric height-adjustable standing desk'),
('Monitor 27"', 'Electronics', 449.99, 60, '27-inch 4K monitor'),
('Keyboard Mechanical', 'Electronics', 149.99, 85, 'RGB mechanical keyboard'),
('Webcam HD', 'Electronics', 79.99, 120, '1080p HD webcam with microphone'),
('Desk Lamp', 'Furniture', 45.99, 75, 'LED desk lamp with adjustable brightness'),
('Notebook Set', 'Office Supplies', 12.99, 300, 'Pack of 5 premium notebooks'),
('Pen Set', 'Office Supplies', 8.99, 500, 'Set of 10 ballpoint pens');

-- Insert sample customers
INSERT INTO customers (name, email, city, country, joined_date, total_orders) VALUES
('Alice Cooper', 'alice@email.com', 'New York', 'USA', '2023-01-10', 5),
('Bob Martinez', 'bob.m@email.com', 'Los Angeles', 'USA', '2023-02-15', 3),
('Carol White', 'carol.w@email.com', 'London', 'UK', '2023-03-20', 8),
('Daniel Lee', 'daniel.l@email.com', 'Toronto', 'Canada', '2023-04-05', 2),
('Eva Schmidt', 'eva.s@email.com', 'Berlin', 'Germany', '2023-05-12', 6),
('Frank Brown', 'frank.b@email.com', 'Sydney', 'Australia', '2023-06-18', 4),
('Grace Kim', 'grace.k@email.com', 'Seoul', 'South Korea', '2023-07-25', 7),
('Henry Wilson', 'henry.w@email.com', 'Chicago', 'USA', '2023-08-30', 1);

-- Insert sample orders
INSERT INTO orders (customer_id, order_date, total_amount, status, shipping_address) VALUES
(1, '2024-01-15 10:30:00', 1329.98, 'delivered', '123 Main St, New York, NY 10001'),
(2, '2024-01-18 14:45:00', 449.99, 'delivered', '456 Oak Ave, Los Angeles, CA 90001'),
(3, '2024-01-20 09:15:00', 629.98, 'shipped', '789 High St, London, UK'),
(1, '2024-01-22 16:00:00', 79.99, 'delivered', '123 Main St, New York, NY 10001'),
(4, '2024-01-25 11:30:00', 1899.97, 'processing', '321 Maple Rd, Toronto, Canada'),
(5, '2024-01-28 13:20:00', 349.99, 'shipped', '654 Berlin St, Berlin, Germany'),
(3, '2024-02-01 10:00:00', 158.98, 'delivered', '789 High St, London, UK'),
(6, '2024-02-03 15:45:00', 599.99, 'pending', '987 Sydney Blvd, Sydney, Australia');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 1299.99), (1, 2, 1, 29.99),
(2, 5, 1, 449.99),
(3, 2, 1, 29.99), (3, 4, 1, 599.99),
(4, 7, 1, 79.99),
(5, 1, 1, 1299.99), (5, 4, 1, 599.99),
(6, 3, 1, 349.99),
(7, 6, 1, 149.99), (7, 9, 1, 8.99),
(8, 4, 1, 599.99);

