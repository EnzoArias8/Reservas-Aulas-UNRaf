CREATE DATABASE ReservaAulasUnraf;

USE ReservaAulasUnraf;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE laboratorios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  edificio VARCHAR(100),
  piso VARCHAR(100),
  equipamiento TEXT,
  capacidad VARCHAR(100)
);

CREATE TABLE reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  laboratorio_id INT,
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id)
);

INSERT INTO laboratorios (nombre, edificio, piso, equipamiento, capacidad) VALUES 
('Aula 1', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 2', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 3', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 4', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 5', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 6', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 7', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 8', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 9', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 10', 'Edificio 4', '1er piso', 'Proyector','60 alumnos'),
('Aula 11', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 12', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 13', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 14', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 15', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 16', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 17', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 18', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 19', 'Edificio 4', '2do piso', 'Proyector','60 alumnos'),
('Aula 20', 'Edificio 4', '2do piso', 'Proyector','60 alumnos')