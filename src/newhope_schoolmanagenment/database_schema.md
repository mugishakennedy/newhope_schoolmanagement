
Mugisha Kennedy
4:46 PM (2 minutes ago)
to me

-- 1. CLASSES TABLE

CREATE TABLE classes (

    id SERIAL PRIMARY KEY,

    class_name VARCHAR(100) NOT NULL,

    academic_year VARCHAR(20) NOT NULL

);

 

-- 2. MODULES TABLE

CREATE TABLE modules (

    id SERIAL PRIMARY KEY,

    module_code VARCHAR(50) UNIQUE NOT NULL,

    module_name VARCHAR(150) NOT NULL,

    description TEXT

);

 

-- 3. DOS (Dean of Studies / Admin) TABLE

CREATE TABLE dos (

    id SERIAL PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- 4. TEACHERS TABLE

CREATE TABLE teachers (

    id SERIAL PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    employee_code VARCHAR(50) UNIQUE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- 5. STUDENTS TABLE

CREATE TABLE students (

    id SERIAL PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    registration_no VARCHAR(50) UNIQUE NOT NULL,

    class_id INT REFERENCES classes(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- 6. TEACHER_MODULES JUNCTION TABLE

CREATE TABLE teacher_modules (

    id SERIAL PRIMARY KEY,

    teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,

    module_id INT REFERENCES modules(id) ON DELETE CASCADE,

    class_id INT REFERENCES classes(id) ON DELETE CASCADE

);

 

-- 7. ASSIGNMENTS TABLE

CREATE TABLE assignments (

    id SERIAL PRIMARY KEY,

    teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,

    module_id INT REFERENCES modules(id) ON DELETE CASCADE,

    class_id INT REFERENCES classes(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    deadline TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- 8. SUBMISSIONS TABLE

CREATE TABLE submissions (

    id SERIAL PRIMARY KEY,

    assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,

    student_id INT REFERENCES students(id) ON DELETE CASCADE,

    content_url TEXT NOT NULL,

    grade DECIMAL(5,2) DEFAULT NULL,

    feedback TEXT DEFAULT NULL,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

